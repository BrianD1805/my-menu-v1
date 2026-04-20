import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orduva Admin",
  description: "Phone-first tenant admin for Orduva.",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Orduva Admin",
  },
  icons: {
    apple: "/orduva-admin-icon-192.png",
    icon: [
      { url: "/orduva-admin-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/orduva-admin-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
