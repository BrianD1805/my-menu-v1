import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin/app/orduva-admin",
    name: "Orduva Admin",
    short_name: "Orduva Admin",
    description: "Phone-first tenant admin for Orduva sellers.",
    start_url: "/admin/login?source=pwa&app=orduva-admin",
    scope: "/admin",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["business", "productivity"],
    launch_handler: {
      client_mode: ["navigate-existing", "auto"],
    },
    icons: [
      {
        src: "/orduva-admin-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/orduva-admin-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/orduva-admin-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
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
