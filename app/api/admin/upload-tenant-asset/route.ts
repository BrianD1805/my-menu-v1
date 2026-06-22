import { NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";

const BUCKET_NAME = "tenant-assets";

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

function mimeTypeFromExtension(fileName: string) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "";
}

function normalizeMimeType(fileName: string, rawMimeType: string) {
  const trimmed = (rawMimeType || "").toLowerCase().trim();
  if (ALLOWED_MIME_TYPES.has(trimmed)) return trimmed;

  // Some browsers/operating systems upload .ico files with an empty type or
  // application/octet-stream. Trust the extension only for the small, explicit
  // image extensions we allow above.
  const inferred = mimeTypeFromExtension(fileName);
  if (inferred) return inferred;

  return trimmed || "application/octet-stream";
}

function sanitizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "store";
}

function safeExtension(fileName: string, mimeType: string) {
  const ext = path.extname(fileName || "").toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/svg+xml") return ".svg";
  if (mimeType === "image/x-icon" || mimeType === "image/vnd.microsoft.icon") return ".ico";
  return ".png";
}

export async function POST(req: Request) {
  const tenantLookup = await resolveAdminTenant(req);
  if (!tenantLookup.ok) return tenantLookup.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!["logo", "favicon", "welcome-banner", "about-us"].includes(kind)) {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    const mimeType = normalizeMimeType(file.name || "", file.type || "");
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Please upload a PNG, JPG, WebP, SVG or ICO image." },
        { status: 400 }
      );
    }

    const maxBytes = kind === "favicon" ? 1024 * 1024 : 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: kind === "favicon" ? "Favicon must be under 1MB." : "Image must be under 4MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const ext = safeExtension(file.name || "", mimeType);
    const tenantSlug = sanitizeSlug(tenantLookup.tenant.slug);
    const fileName = `${kind}-${Date.now()}${ext}`;
    const storagePath = `${tenantSlug}/${fileName}`;

    const { error: uploadError } = await db.storage
      .from(BUCKET_NAME)
      .upload(storagePath, arrayBuffer, {
        cacheControl: "31536000",
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Supabase Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = db.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;

    if (kind === "logo" || kind === "favicon") {
      const settingsPayload = {
        tenant_id: tenantLookup.tenant.id,
        ...(kind === "logo" ? { logo_url: publicUrl } : { favicon_url: publicUrl }),
      };

      const { error: settingsError } = await db
        .from("tenant_settings")
        .upsert(settingsPayload, { onConflict: "tenant_id" });

      if (settingsError) {
        return NextResponse.json(
          { error: `Image uploaded, but settings could not be saved: ${settingsError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      url: publicUrl,
      storagePath,
      saved: kind === "logo" || kind === "favicon",
      message:
        kind === "logo"
          ? "Logo uploaded and saved."
          : kind === "favicon"
            ? "Favicon uploaded and saved."
            : "Image uploaded. Save this settings section to publish it.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
