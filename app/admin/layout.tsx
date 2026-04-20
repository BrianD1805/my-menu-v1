import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminPwaRegistrar from "@/components/admin/AdminPwaRegistrar";

export const metadata: Metadata = {
  title: "Orduva Admin",
  description: "Phone-first tenant admin for Orduva.",
  applicationName: "Orduva Admin",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orduva Admin",
  },
  icons: {
    icon: [
      { url: "/orduva-admin-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/orduva-admin-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/orduva-admin-icon-192.png",
    apple: [{ url: "/orduva-admin-icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  themeColor: "#000000",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Orduva Admin",
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminPwaRegistrar />
      {children}
    </>
  );
}
