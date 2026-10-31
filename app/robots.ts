import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";

export default function robots(): MetadataRoute.Robots {
  const base = appConfig.siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/owner", "/me", "/onboarding", "/login", "/auth", "/api", "/go"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
