import { ImageResponse } from "next/og";
import { db } from "@/db";
import { wpOptions } from "@/db/schema";
import { sql } from "drizzle-orm";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  let siteName = "PressForge News";
  let tagline = "Independent News, Investigative Reporting & Editorial Excellence";
  let ogDefaultImage = "";
  let ogSiteName = "";

  try {
    const rows = await db
      .select({
        name: wpOptions.optionName,
        value: wpOptions.optionValue,
      })
      .from(wpOptions)
      .where(
        sql`${wpOptions.optionName} IN ('blogname', 'blogdescription', 'og_default_image', 'og_site_name')`
      );

    for (const r of rows) {
      if (r.name === "blogname" && r.value) siteName = r.value;
      if (r.name === "blogdescription" && r.value) tagline = r.value;
      if (r.name === "og_default_image" && r.value) ogDefaultImage = r.value;
      if (r.name === "og_site_name" && r.value) ogSiteName = r.value;
    }
  } catch {
    // fallback
  }

  const effectiveSiteName = ogSiteName || siteName;

  // If a custom default OG image has been uploaded or configured in Settings, render it
  if (ogDefaultImage && ogDefaultImage.trim().length > 0) {
    const fullImageUrl = ogDefaultImage.startsWith("http")
      ? ogDefaultImage
      : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${ogDefaultImage}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            backgroundColor: "#0f172a",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullImageUrl}
            alt={effectiveSiteName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ),
      {
        ...size,
      }
    );
  }

  // Fallback to editorial dynamic card
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            display: "flex",
            backgroundImage:
              "radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #0f172a 1px)",
            backgroundSize: "40px 40px",
            backgroundPosition: "0 0, 20px 20px",
          }}
        />

        {/* Top bar with branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              backgroundColor: "#2271b1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            {effectiveSiteName.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            {effectiveSiteName}
          </div>
        </div>

        {/* Headline / Main statement */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            {effectiveSiteName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              lineHeight: 1.4,
              color: "#94a3b8",
              fontWeight: 400,
            }}
          >
            {tagline}
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #334155",
            paddingTop: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            Daily Editorial & Breaking News
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "18px",
              color: "#38bdf8",
              fontWeight: 600,
            }}
          >
            {effectiveSiteName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.local
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
