import "dotenv/config"
import assert from "node:assert/strict"
import { writeFile } from "node:fs/promises"
import { getStudioWidgetContent } from "../services/studio-content.service"
import { getPublishedPosts, getPublishedPostBySlug } from "../lib/site-content"
import { pool } from "../db"

async function main() {
  const invalid = /&(?:nbsp|amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/i
  let checked = 0
  const first = await getStudioWidgetContent({
    locale: "ar",
    categorySlug: "all",
    pageSize: 100,
    page: 1,
  })
  const check = (items: typeof first.items) => {
    for (const item of items) {
      assert(
        !invalid.test(item.excerpt),
        `Encoded excerpt remains on post ${item.id}`
      )
      assert(
        !invalid.test(item.title),
        `Encoded title remains on post ${item.id}`
      )
      for (const label of [...item.categories, ...item.tags]) {
        assert(!invalid.test(label), `Encoded taxonomy label remains on post ${item.id}`)
      }
      checked++
    }
  }
  check(first.items)
  const pages = Math.ceil(first.total / first.pageSize)
  for (let page = 2; page <= pages; page++) {
    check(
      (
        await getStudioWidgetContent({
          locale: "ar",
          categorySlug: "all",
          pageSize: 100,
          page,
        })
      ).items
    )
    if (page % 10 === 0)
      console.log(JSON.stringify({ checked, total: first.total }))
  }
  assert.equal(checked, first.total)
  for (const locale of ["ar", "en"]) {
    const items = await getPublishedPosts(36, locale)
    for (const item of items) {
      assert(!invalid.test(item.excerpt), `Legacy feed excerpt ${item.id}`)
      const article = await getPublishedPostBySlug(item.slug, locale)
      assert(
        article && !invalid.test(article.excerpt),
        `Article excerpt ${item.id}`
      )
    }
  }
  await writeFile(
    ".local/wordpress-migration/content-text-verification.json",
    JSON.stringify(
      {
        studioPublishedPostsChecked: checked,
        publicFeedAndArticleSamplesChecked: true,
      },
      null,
      2
    )
  )
  console.log(
    JSON.stringify({
      studioPublishedPostsChecked: checked,
      publicFeedAndArticleSamplesChecked: true,
    })
  )
}
main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Text verification failed"
    )
    process.exitCode = 1
  })
  .finally(() => pool.end())
