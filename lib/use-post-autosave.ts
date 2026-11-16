"use client"
import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
  postAutosaveRecordSchema,
  postEditorSnapshotSchema,
  type PostEditorSnapshot,
  type PostAutosaveRecord,
  type PostAutosaveRequest,
} from "@/db/schema/cms-post-autosave"
import {
  postAutosaveStorageKey,
  localPostAutosaves,
} from "./post-autosave-storage"

type Status =
  | "recovery_required"
  | "ready"
  | "saving"
  | "saved"
  | "draft_saved"
  | "unavailable"
  | "expired"
  | "account_changed"
  | "conflict"
  | "post_changed"
  | "too_large"
export function usePostAutosave({
  ownerId,
  documentKey,
  baseModified,
  snapshot,
  initialSnapshot,
  enabled,
  onRestore,
  readContent,
}: {
  ownerId: string
  documentKey: string
  baseModified: string
  snapshot: PostEditorSnapshot
  initialSnapshot: PostEditorSnapshot
  enabled: boolean
  onRestore: (snapshot: PostEditorSnapshot) => void
  readContent?: () => string | undefined
}) {
  const [status, setStatus] = useState<Status>("ready")
  const [candidate, setCandidate] = useState<PostAutosaveRecord | null>(null)
  const [savedAt, setSavedAt] = useState("")
  const [draftPostId, setDraftPostId] = useState<string | undefined>()
  const [loaded, setLoaded] = useState(false)
  const [initialSerialized] = useState(() => JSON.stringify(initialSnapshot))
  const latest = useRef(snapshot),
    baseline = useRef(initialSerialized),
    version = useRef(0)
  const sourceModified = useRef(baseModified)
  const lastRemote = useRef(initialSerialized),
    busy = useRef(false),
    recoveryPending = useRef(false)
  const readContentRef = useRef(readContent)
  useEffect(() => {
    readContentRef.current = readContent
  }, [readContent])
  const capture = () => {
    let content: string | undefined
    try {
      content = readContentRef.current?.()
    } catch {
      /* TinyMCE may be switching between editor modes. */
    }
    return content === undefined
      ? latest.current
      : { ...latest.current, content }
  }
  const manualPaused = useRef(false)
  const pendingWrite = useRef<Promise<PostAutosaveRecord> | null>(null)
  const selectedLocalKey = useRef<string | null>(null)
  const selectedLocalValue = useRef<string | null>(null)
  const storageKey = postAutosaveStorageKey(ownerId, documentKey)
  useEffect(() => {
    latest.current = snapshot
  }, [snapshot])

  const { mutateAsync } = useMutation({
    mutationFn: async (packet: PostAutosaveRequest) => {
      const response = await fetch("/api/admin/posts/autosave", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packet),
        signal: AbortSignal.timeout(15000),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "unavailable")
      if (body.ownerId !== ownerId) throw new Error("account_changed")
      return postAutosaveRecordSchema.parse(body.record)
    },
  })

  const clearLegacyCopy = () => {
    try {
      if (selectedLocalKey.current && localStorage.getItem(selectedLocalKey.current) === selectedLocalValue.current)
        localStorage.removeItem(selectedLocalKey.current)
    } catch { /* A server save must not fail because legacy browser cleanup failed. */ }
  }

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const load = async () => {
      let local: PostAutosaveRecord | null = null,
        remote: PostAutosaveRecord | null = null
      try {
        const entry = localPostAutosaves(
          localStorage,
          storageKey,
          documentKey
        )[0]
        local = entry?.record || null
        selectedLocalKey.current = entry?.key || null
        selectedLocalValue.current = entry
          ? localStorage.getItem(entry.key)
          : null
        if (local && JSON.stringify(local.snapshot) !== baseline.current)
          recoveryPending.current = true
      } catch {
        /* Old browser copies are optional migration inputs; no new copies are written. */
      }
      try {
        const response = await fetch(
          `/api/admin/posts/autosave?${new URLSearchParams({ documentKey, ownerId })}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: AbortSignal.timeout(15000),
          }
        )
        const body = await response.json()
        if (!response.ok) {
          if (!cancelled)
            setStatus(
              response.status === 401
                ? "expired"
                : body.error === "account_changed"
                  ? "account_changed"
                  : "unavailable"
            )
        } else {
          if (body.ownerId !== ownerId) {
            if (!cancelled) setStatus("account_changed")
            return
          }
          if (body.record) remote = postAutosaveRecordSchema.parse(body.record)
        }
      } catch {
        if (!cancelled) setStatus("unavailable")
      }
      if (cancelled) return
      version.current = remote?.version || 0
      if (remote) {
        lastRemote.current = JSON.stringify(remote.snapshot)
        setSavedAt(remote.savedAt)
        setDraftPostId(remote.draftPostId)
        if (documentKey.startsWith("new:")) sourceModified.current = remote.baseModified
      }
      const newest =
        [local, remote]
          .filter((item): item is PostAutosaveRecord => Boolean(item))
          .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))[0] ||
        null
      const recovery =
        newest && JSON.stringify(newest.snapshot) !== baseline.current
          ? newest
          : null
      if (recovery) {
        recoveryPending.current = true
        setCandidate(recovery)
      }
      setLoaded(true)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [enabled, documentKey, ownerId, storageKey])

  useEffect(() => {
    if (!enabled) return
    const save = async () => {
      if (
        !loaded ||
        manualPaused.current ||
        busy.current ||
        recoveryPending.current ||
        document.hidden
      )
        return
      const captured = capture()
      const serialized = JSON.stringify(captured)
      if (serialized === lastRemote.current)
        return
      const parsed = postEditorSnapshotSchema.safeParse(captured)
      if (!parsed.success) {
        setStatus("too_large")
        return
      }
      busy.current = true
      setStatus("saving")
      try {
        pendingWrite.current = mutateAsync({
          ownerId,
          documentKey,
          baseModified: sourceModified.current,
          expectedVersion: version.current,
          snapshot: parsed.data,
        })
        const record = await pendingWrite.current
        version.current = record.version
        sourceModified.current = record.baseModified
        setSavedAt(record.savedAt)
        setDraftPostId(record.draftPostId)
        lastRemote.current = serialized
        clearLegacyCopy()
        setStatus(record.draftPostId ? "draft_saved" : "saved")
      } catch (error) {
        const code = error instanceof Error ? error.message : "unavailable"
        setStatus(
          (
            [
              "expired",
              "account_changed",
              "conflict",
              "post_changed",
              "too_large",
            ] as string[]
          ).includes(code)
            ? (code as Status)
            : "unavailable"
        )
      } finally {
        busy.current = false
        pendingWrite.current = null
      }
    }
    const serverTimer = setInterval(save, 30000)
    const unload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(capture()) !== lastRemote.current) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", unload)
    return () => {
      clearInterval(serverTimer)
      window.removeEventListener("beforeunload", unload)
    }
  }, [enabled, loaded, ownerId, documentKey, baseModified, mutateAsync])

  return {
    enabled,
    status,
    candidate,
    savedAt,
    draftPostId,
    sourceModified,
    documentKey,
    version,
    restore: () => {
      if (candidate) {
        onRestore(candidate.snapshot)
        recoveryPending.current = false
        setCandidate(null)
        setStatus("ready")
      }
    },
    keepCurrent: () => {
      setStatus("ready")
      recoveryPending.current = false
      setCandidate(null)
    },
    prepareSubmission: async () => {
      if (!enabled) return true
      if (recoveryPending.current) {
        setStatus("recovery_required")
        return false
      }
      manualPaused.current = true
      await pendingWrite.current?.catch(() => undefined)
      try {
        const response = await fetch("/api/auth/get-session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: AbortSignal.timeout(15000),
        })
        const data = await response.json()
        if (!data?.user?.id) {
          setStatus("expired")
          return false
        }
        if (data.user.id !== ownerId) {
          setStatus("account_changed")
          return false
        }
        return true
      } catch {
        setStatus("unavailable")
        return false
      }
    },
    cancelSubmission: () => {
      manualPaused.current = false
    },
    acknowledgeSaved: () => {
      baseline.current = JSON.stringify(latest.current)
      lastRemote.current = baseline.current
      clearLegacyCopy()
    },
  }
}
