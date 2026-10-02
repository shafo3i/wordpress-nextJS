import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/lib/site-content";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  const title = post?.title || "PressForge Article";
  const category = post?.categories?.[0] || "World News";
  const author = post?.authorName || "Staff Reporter";
  const dateStr = post?.date
    ? new Date(post.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

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
          backgroundColor: "#090d16",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle decorative accent border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #2271b1 0%, #38bdf8 100%)",
          }}
        />

        {/* Header with category and brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "#2271b1",
                color: "#ffffff",
                padding: "8px 18px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {category}
            </div>
            {dateStr ? (
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "18px",
                  fontWeight: 500,
                }}
              >
                {dateStr}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              P
            </div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#cbd5e1",
              }}
            >
              PressForge
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "1020px",
          }}
        >
          <div
            style={{
              fontSize: title.length > 70 ? "46px" : "56px",
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer: Author & Editorial Attribution */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #1e293b",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              {author[0] || "A"}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#f1f5f9",
                }}
              >
                {author}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                Staff Journalist
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "16px",
              color: "#64748b",
              fontWeight: 500,
            }}
          >
            Read the full story on PressForge
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
