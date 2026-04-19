import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { resolveAdminTenant } from "@/lib/admin-tenant";

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
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

    if (!["logo", "favicon"].includes(kind)) {
      return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || "").toLowerCase() || ".png";
    const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"].includes(ext) ? ext : ".png";
    const folder = path.join(process.cwd(), "public", "tenant-assets", tenantLookup.tenant.slug);
    await mkdir(folder, { recursive: true });

    const baseName = kind === "logo" ? "logo" : "favicon";
    const fileName = sanitizeFileName(`${baseName}${safeExt}`);
    const fullPath = path.join(folder, fileName);
    await writeFile(fullPath, bytes);

    const publicUrl = `/tenant-assets/${tenantLookup.tenant.slug}/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
