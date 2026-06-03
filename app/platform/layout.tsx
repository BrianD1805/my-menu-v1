import OwnerPlatformAccessGate from "@/components/admin/OwnerPlatformAccessGate";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Orduva Owner Platform",
  description: "Owner dashboard for urgent Orduva platform checks, billing and tenant support.",
  applicationName: "Orduva Owner Platform",
  manifest: "/platform/manifest.webmanifest?v=0.229g",
  themeColor: "#336699",
  icons: {
    icon: [
      { url: "/orduva-owner-platform-favicon.ico?v=0.229g" },
      { url: "/orduva-owner-platform-icon-32.png?v=0.229g", sizes: "32x32", type: "image/png" },
      { url: "/orduva-owner-platform-icon-192.png?v=0.229g", sizes: "192x192", type: "image/png" },
      { url: "/orduva-owner-platform-icon-512.png?v=0.229g", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/orduva-owner-platform-favicon.ico?v=0.229g",
    apple: "/orduva-owner-platform-icon-192.png?v=0.229g",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Orduva Owner",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Orduva Owner",
  },
};

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <OwnerPlatformAccessGate>{children}</OwnerPlatformAccessGate>;
}
