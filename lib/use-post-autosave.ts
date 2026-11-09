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
  const [storageFailed, setStorageFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [initialSerialized] = useState(() => JSON.stringify(initialSnapshot))
  const latest = useRef(snapshot),
    baseline = useRef(initialSerialized),
    version = useRef(0)
  const lastRemote = useRef(initialSerialized),
    localWritten = useRef(""),
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
  const clientId = useRef("")
  const selectedLocalKey = useRef<string | null>(null)
  const selectedLocalValue = useRef<string | null>(null)
  useEffect(() => {
    clientId.current =
      crypto.randomUUID?.() ||
      Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) =>
        value.toString(16).padStart(2, "0")
      ).join("")
  }, [])
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

  const writeLocal = () => {
    if (!enabled) return
    const captured = capture()
    const serialized = JSON.stringify(captured)
    if (serialized === baseline.current || serialized === localWritten.current)
      return
    try {
      const record = {
        documentKey,
        baseModified,
        snapshot: captured,
        version: Math.max(1, version.current),
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(
        `${storageKey}:${clientId.current}`,
        JSON.stringify(record)
      )
      localWritten.current = serialized
      setStorageFailed(false)
    } catch {
      setStorageFailed(true)
    }
  }
  const writeLocalRef = useRef(writeLocal)
  useEffect(() => {
    writeLocalRef.current = writeLocal
  })

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
        setStorageFailed(true)
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
      writeLocalRef.current()
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
      if (serialized === baseline.current || serialized === lastRemote.current)
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
          baseModified,
          expectedVersion: version.current,
          snapshot: parsed.data,
        })
        const record = await pendingWrite.current
        version.current = record.version
        lastRemote.current = serialized
        setStatus("saved")
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
    const localTimer = setInterval(() => writeLocalRef.current(), 1000)
    const serverTimer = setInterval(save, 30000)
    const unload = (event: BeforeUnloadEvent) => {
      writeLocalRef.current()
      if (JSON.stringify(latest.current) !== baseline.current) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    const hide = () => writeLocalRef.current()
    window.addEventListener("beforeunload", unload)
    window.addEventListener("pagehide", hide)
    return () => {
      writeLocalRef.current()
      clearInterval(localTimer)
      clearInterval(serverTimer)
      window.removeEventListener("beforeunload", unload)
      window.removeEventListener("pagehide", hide)
    }
  }, [enabled, loaded, ownerId, documentKey, baseModified, mutateAsync])

  return {
    enabled,
    status,
    candidate,
    storageFailed,
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
      try {
        localStorage.setItem(
          `${storageKey}:${clientId.current}`,
          JSON.stringify({
            documentKey,
            baseModified,
            snapshot: latest.current,
            version: Math.max(1, version.current),
            savedAt: new Date().toISOString(),
          })
        )
      } catch {
        setStorageFailed(true)
      }
    },
    prepareSubmission: async () => {
      writeLocalRef.current()
      if (!enabled) return true
      if (recoveryPending.current) {
        setStatus("recovery_required")
        return false
      }
      await pendingWrite.current?.catch(() => undefined)
      manualPaused.current = true
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
      try {
        localStorage.removeItem(`${storageKey}:${clientId.current}`)
        if (
          selectedLocalKey.current &&
          localStorage.getItem(selectedLocalKey.current) ===
            selectedLocalValue.current
        )
          localStorage.removeItem(selectedLocalKey.current)
      } catch {
        /* The server save has already succeeded. */
      }
    },
  }
}
