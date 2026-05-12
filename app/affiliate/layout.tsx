import type React from "react";

export const metadata = {
  manifest: "/affiliate/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Orduva Affiliate",
    statusBarStyle: "black-translucent",
  },
};

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
