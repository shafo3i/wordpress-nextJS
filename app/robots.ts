import type { MetadataRoute } from "next";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getBaseSiteUrl } from "@/services/sitemap.service";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseSiteUrl();

  // Check WordPress 'blog_public' setting
  let blogPublic = true;
  try {
    const row = await db
      .select({ optionValue: wpOptions.optionValue })
      .from(wpOptions)
      .where(eq(wpOptions.optionName, "blog_public"))
      .limit(1);

    if (row.length > 0 && row[0].optionValue === "0") {
      blogPublic = false;
    }
  } catch {
    // default to true if error
  }

  if (!blogPublic) {
    // Discourage search engines from indexing this site
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admincp/", "/api/"],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/news-sitemap.xml`,
    ],
  };
}
