import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/platform/app/orduva-owner-platform-v2",
    name: "Orduva Owner Platform",
    short_name: "Orduva Owner",
    description: "Owner dashboard for urgent Orduva platform checks, billing and tenant support.",
    start_url: "/platform?source=pwa&app=orduva-owner-platform",
    scope: "/platform",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#F3F7FA",
    theme_color: "#336699",
    categories: ["business", "productivity"],
    launch_handler: {
      client_mode: ["navigate-existing", "auto"],
    },
    icons: [
      { src: "/orduva-owner-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-owner-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/orduva-owner-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/orduva-owner-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
