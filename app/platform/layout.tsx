import OwnerPlatformAccessGate from "@/components/admin/OwnerPlatformAccessGate";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Orduva Owner Platform",
  description: "Owner dashboard for urgent Orduva platform checks, billing and tenant support.",
  applicationName: "Orduva Owner Platform",
  manifest: "/platform/manifest.webmanifest",
  themeColor: "#336699",
  icons: {
    icon: [
      { url: "/orduva-owner-platform-favicon.ico" },
      { url: "/orduva-owner-platform-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/orduva-owner-platform-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/orduva-owner-platform-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/orduva-owner-platform-favicon.ico",
    apple: "/orduva-owner-platform-icon-192.png",
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
