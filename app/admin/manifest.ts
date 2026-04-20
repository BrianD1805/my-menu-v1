import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orduva Admin",
    short_name: "Admin",
    description: "Phone-first tenant admin for Orduva sellers.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1f5f9",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/orduva-admin-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/orduva-admin-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/orduva-admin-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
