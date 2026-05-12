import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/affiliate/app/orduva-affiliate",
    name: "Orduva Affiliate",
    short_name: "Affiliate",
    description: "Approved Orduva affiliate dashboard.",
    start_url: "/affiliate/login?source=pwa&app=orduva-affiliate",
    scope: "/affiliate",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#FFF7F0",
    theme_color: "#0E0E10",
    categories: ["business", "productivity"],
    icons: [
      { src: "/orduva-notification-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
