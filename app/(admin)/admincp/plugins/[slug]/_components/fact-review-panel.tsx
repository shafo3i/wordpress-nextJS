"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  searchFactPosts,
  loadFactReview,
  saveFactReviewAction,
} from "../../fact-review-action"
import type { FactReviewInput } from "@/db/schema/cms-fact-reviews"

export function FactReviewPanel({ dict }: { dict: Record<string, string> }) {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [postId, setPostId] = useState("")
  const posts = useQuery({
    queryKey: ["fact-review-posts", query],
    queryFn: () => searchFactPosts(query),
  })
  const review = useQuery({
    queryKey: ["fact-review", postId],
    queryFn: () => loadFactReview(postId),
    enabled: !!postId,
  })
  return (
    <section className="space-y-4 border border-[#c3c4c7] bg-white p-5">
      <h2 className="font-semibold">{dict["admin.plugins.fact.panel"]}</h2>
      <p>{dict["admin.plugins.fact.help"]}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(search)
        }}
        className="flex gap-2"
      >
        <input
          aria-label={dict["admin.plugins.fact.search"]}
          className="h-[30px] border border-[#8c8f94] px-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
        />
        <button className="border border-[#2271b1] px-3 text-[#2271b1]">
          {dict["admin.plugins.fact.search"]}
        </button>
      </form>
      <label className="block">
        {dict["admin.plugins.fact.post"]}
        <select
          aria-label={dict["admin.plugins.fact.post"]}
          className="block h-[30px] w-full border border-[#8c8f94]"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
        >
          <option value="">{dict["admin.plugins.fact.choose"]}</option>
          {posts.data?.map((post) => (
            <option key={post.id} value={post.id}>
              {post.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        {dict["admin.plugins.fact.post_id"]}
        <input
          inputMode="numeric"
          className="h-[30px] border border-[#8c8f94] px-2"
          value={postId}
          onChange={(e) => {
            if (/^\d{0,18}$/.test(e.target.value)) setPostId(e.target.value)
          }}
        />
      </label>
      {(posts.isError || review.isError) && (
        <p role="alert">{dict["admin.plugins.fact.not_found"]}</p>
      )}
      {review.data && (
        <FactReviewForm
          key={`${postId}:${review.data.current?.version}:${review.data.sourceHash}`}
          data={review.data}
          dict={dict}
        />
      )}
    </section>
  )
}
function FactReviewForm({
  data,
  dict,
}: {
  data: Awaited<ReturnType<typeof loadFactReview>>
  dict: Record<string, string>
}) {
  const client = useQueryClient(),
    current = data.current
  const [claim, setClaim] = useState(current?.claim || ""),
    [summary, setSummary] = useState(current?.summary || ""),
    [sources, setSources] = useState(current?.sources.join("\n") || ""),
    [status, setStatus] = useState<FactReviewInput["status"]>(
      current?.status || "unreviewed"
    ),
    [approve, setApprove] = useState(false),
    [error, setError] = useState("")
  const save = useMutation({
    mutationFn: saveFactReviewAction,
    onSuccess: async (result) => {
      if (!result.success)
        setError(result.error || "admin.plugins.invalid_config")
      else {
        setError("")
        await client.invalidateQueries({
          queryKey: ["fact-review", data.postId],
        })
      }
    },
    onError: () => setError("admin.plugins.save_failed"),
  })
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        setError("")
        save.mutate({
          postId: data.postId,
          expectedVersion: current?.version || 0,
          sourceHash: data.sourceHash,
          claim,
          summary,
          sources: sources
            .split(/\r?\n/)
            .map((v) => v.trim())
            .filter(Boolean),
          status,
          approve,
        })
      }}
    >
      <h3 className="font-semibold">{data.title}</h3>
      {current && current.sourceHash !== data.sourceHash && (
        <p role="status">{dict["admin.plugins.fact.stale"]}</p>
      )}
      <fieldset disabled={save.isPending} className="space-y-3">
        <label className="block">
          {dict["admin.plugins.fact.claim"]}
          <textarea
            aria-label={dict["admin.plugins.fact.claim"]}
            maxLength={2000}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            className="block w-full border border-[#8c8f94] p-2"
          />
        </label>
        <label className="block">
          {dict["admin.plugins.fact.summary"]}
          <textarea
            aria-label={dict["admin.plugins.fact.summary"]}
            maxLength={8000}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="block w-full border border-[#8c8f94] p-2"
          />
        </label>
        <label className="block">
          {dict["admin.plugins.fact.sources"]}
          <textarea
            aria-label={dict["admin.plugins.fact.sources"]}
            maxLength={42000}
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            className="block w-full border border-[#8c8f94] p-2"
          />
        </label>
        <label className="block">
          {dict["admin.plugins.fact.status"]}
          <select
            aria-label={dict["admin.plugins.fact.status"]}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as FactReviewInput["status"])
              setApprove(false)
            }}
            className="block h-[30px] border border-[#8c8f94]"
          >
            {(
              [
                "unreviewed",
                "in_review",
                "supported",
                "misleading",
                "false",
                "insufficient",
              ] as const
            ).map((value) => (
              <option key={value} value={value}>
                {dict[`admin.plugins.fact.status.${value}`]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={approve}
            onChange={(e) => setApprove(e.target.checked)}
          />
          {dict["admin.plugins.fact.approve"]}
        </label>
        <button className="h-[30px] border border-[#2271b1] bg-[#2271b1] px-3 text-white">
          {dict["admin.plugins.save_settings"]}
        </button>
      </fieldset>
      {error && (
        <p role="alert">
          {dict[error] || dict["admin.plugins.invalid_config"]}
        </p>
      )}
      <details>
        <summary>
          {dict["admin.plugins.fact.history"]} ({data.history.length})
        </summary>
        <ol>
          {data.history.map((record) => (
            <li
              key={record.version}
              className="my-3 border-b border-[#c3c4c7] py-2"
            >
              <p>
                {dict[`admin.plugins.fact.status.${record.status}`]} ·{" "}
                {record.reviewerName} ·{" "}
                {new Date(record.reviewedAt).toLocaleString()}
              </p>
              <p>{record.claim}</p>
              <p>{record.summary}</p>
              <ul>
                {record.sources.map((source) => (
                  <li key={source}>
                    <a
                      className="text-[#2271b1] underline"
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </details>
    </form>
  )
}
