import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://sign.studiohappens.tech/sitemap.xml",
    host: "https://sign.studiohappens.tech",
  };
}
