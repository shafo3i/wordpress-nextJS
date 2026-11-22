"use client"

import Link from "next/link"
import { PostThumbnail } from "@/components/site/post-thumbnail"
import { ThemeSectionHeader } from "@/components/site/section-header"
import { formatDate, getExcerpt, getPostUrl } from "@/components/site/utils"
import type { ContentItem } from "@/lib/site-content"
import type { FrontEndThemeContext } from "@/lib/site-theme"
import type { HomepageBlock } from "@/lib/themes/homepage-types"
import styles from "./column.module.css"

export function CategoryColumnBlock({ posts, block, theme }: {
  posts: ContentItem[]; block: HomepageBlock; theme: FrontEndThemeContext
}) {
  if (!posts.length) return null
  return <section className={styles.column} data-category-column dir={theme.direction}>
    <ThemeSectionHeader title={block.title} subtitle={block.subtitle} linkText={block.linkText} linkHref={block.linkHref} theme={theme} />
    <div data-studio-items>
      {posts.map((post, index) => <article key={post.id} className={index === 0 ? styles.lead : styles.story} data-studio-divider="bottom">
        {index < 3 && block.imageRatio !== "none" && <Link href={getPostUrl(post.slug, theme)} className={index === 0 ? styles.leadImage : styles.thumbnail} tabIndex={-1} aria-hidden="true" data-studio-image>
          <PostThumbnail post={post} theme={theme} src={post.imageUrl} srcSet={post.imageSrcSet} alt="" loading="lazy" sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" />
        </Link>}
        <div className={styles.copy}>
          <h3 data-studio-title><Link href={getPostUrl(post.slug, theme)}>{post.title}</Link></h3>
          {index === 0 && block.showExcerpt && <p data-studio-excerpt>{getExcerpt(post, 150)}</p>}
          {((block.showDate !== false && index === 0) || block.showAuthor) && <div className={styles.meta} data-studio-meta>
            {block.showDate !== false && index === 0 && <time dateTime={new Date(post.date).toISOString()}>{formatDate(post.date, theme.locale, theme.timeZone)}</time>}
            {block.showAuthor && <span>{post.authorName}</span>}
          </div>}
        </div>
      </article>)}
    </div>
  </section>
}
