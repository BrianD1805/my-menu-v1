import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import AdminPwaRegistrar from "@/components/admin/AdminPwaRegistrar";


export const viewport: Viewport = {
  themeColor: "#0F766E",
  colorScheme: "light",
};

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
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/orduva-apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  themeColor: "#0F766E",
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
