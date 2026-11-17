"use client"
import Link from "next/link"
import { PostThumbnail } from "@/components/site/post-thumbnail"
import { ThemeSectionHeader } from "@/components/site/section-header"
import { formatDate, getExcerpt, getPostUrl } from "@/components/site/utils"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import type { StudioDesign } from "@/db/schema/cms-studio-design"
import styles from "./newsroom.module.css"

type Props = {
  posts: ContentItem[]
  block: HomepageBlock
  theme: FrontEndThemeContext
  design?: StudioDesign
}
export function NewsroomBlock({ posts, block, theme, design }: Props) {
  if (!posts.length) return null
  const variant =
    block.displayStyle === "newsroom_category"
      ? "category"
      : block.displayStyle === "newsroom_strip"
        ? "strip"
        : "lead"
  // Every position comes from the same filtered feed. Never query unrelated sidebar stories.
  const [lead, ...rest] = posts
  const sidePosts = rest.slice(0, 6)
  const start = sidePosts.filter((_, i) => i % 2 === 0)
  const end = sidePosts.filter((_, i) => i % 2 === 1)
  const card = (
    post: ContentItem,
    kind: "lead" | "story" | "compact",
    eager = false
  ) => (
    <article
      key={post.id}
      className={`${styles.card} ${styles[kind]}`}
      data-studio-card
      data-studio-divider={kind === "compact" ? "top" : undefined}
      data-newsroom-story={post.id}
    >
      {post.imageUrl && block.imageRatio !== "none" && (
        <Link
          href={getPostUrl(post.slug, theme)}
          className={styles.media}
          tabIndex={-1}
          aria-hidden="true"
        >
          <PostThumbnail
            post={post}
            theme={theme}
            src={post.imageUrl}
            srcSet={post.imageSrcSet}
            alt=""
            loading={eager ? "eager" : "lazy"}
            sizes={
              kind === "lead"
                ? "(min-width: 1024px) 50vw, 100vw"
                : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            }
            className={styles.image}
            data-studio-image
          />
        </Link>
      )}
      <div className={styles.copy}>
        <h3 data-studio-title>
          <Link href={getPostUrl(post.slug, theme)}>{post.title}</Link>
        </h3>
        {kind === "lead" &&
          block.showExcerpt !== false &&
          (design?.excerptLength ?? 180) > 0 && (
            <p className={styles.excerpt} data-studio-excerpt>
              {getExcerpt(post, design?.excerptLength ?? 180)}
            </p>
          )}
        <div className={styles.meta} data-studio-meta>
          {block.showCategory !== false && post.categories[0] && (
            <span data-studio-category>{post.categories[0]}</span>
          )}
          {block.showDate !== false && (
            <time dateTime={new Date(post.date).toISOString()}>
              {formatDate(post.date, theme.locale, theme.timeZone)}
            </time>
          )}
          {block.showAuthor && post.authorName && (
            <span>{post.authorName}</span>
          )}
        </div>
      </div>
    </article>
  )
  return (
    <section
      className={styles.section}
      dir={theme.direction}
      data-newsroom={variant}
      data-newsroom-columns={Math.min(posts.length, 3)}
      data-newsroom-image-ratio={block.imageRatio}
      data-newsroom-borders={design?.postDividers === false ? "off" : undefined}
    >
      <ThemeSectionHeader
        title={block.title}
        subtitle={block.subtitle}
        linkText={block.linkText}
        linkHref={block.linkHref}
        theme={theme}
      />
      {variant === "lead" ? (
        <div className={styles.front} data-studio-items>
          <div className={styles.centre}>
            {card(lead, "lead", true)}
            {rest.length > 6 && (
              <div className={styles.followups}>
                {rest.slice(6).map((post) => card(post, "story"))}
              </div>
            )}
          </div>
          {!!start.length && (
            <div className={styles.start}>
              {start.map((post) => card(post, "story"))}
            </div>
          )}
          {!!end.length && (
            <div className={styles.end}>
              {end.map((post, i) => card(post, i < 2 ? "story" : "compact"))}
            </div>
          )}
        </div>
      ) : variant === "category" ? (
        <div className={styles.category} data-studio-items>
          {card(lead, "lead")}
          {rest.map((post) => card(post, "compact"))}
        </div>
      ) : (
        <div className={styles.strip} data-studio-items>
          {posts.map((post) => card(post, "story"))}
        </div>
      )}
    </section>
  )
}
