import { parentPort, workerData } from "node:worker_threads"
import { importArticleHtml, rewriteWordPressUrl } from "./content"

const input = workerData as {
  posts: { ID: string; post_content: string; post_excerpt: string }[]
  articles: [string, string][]
}
const ids = new Map(input.articles)
const slugs = new Set(ids.values())
const rewrite = (url: string) => rewriteWordPressUrl(url, slugs, ids)
parentPort!.postMessage(
  input.posts.map((p) => [
    p.ID,
    {
      content: importArticleHtml(p.post_content || "", rewrite),
      excerpt: importArticleHtml(p.post_excerpt || "", rewrite),
    },
  ])
)
