import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduMaps.kg",
    short_name: "EduMaps",
    description: "An independent guide to schools in Kyrgyzstan.",
    id: "/",
    // "/" redirects to the language the visitor used last (Kyrgyz by default).
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#185078",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
