import {
  AUTOSAVE_TTL_MS,
  postAutosaveRecordSchema,
  type PostAutosaveRecord,
} from "@/db/schema/cms-post-autosave"
export function postAutosaveStorageKey(ownerId: string, documentKey: string) {
  return `cms:post-recovery:v1:${encodeURIComponent(ownerId)}:${documentKey}`
}
export function readLocalPostAutosave(
  raw: string | null,
  documentKey: string,
  now = Date.now()
): PostAutosaveRecord | null {
  try {
    const result = postAutosaveRecordSchema.safeParse(JSON.parse(raw || "null"))
    return result.success &&
      result.data.documentKey === documentKey &&
      now - Date.parse(result.data.savedAt) <= AUTOSAVE_TTL_MS
      ? result.data
      : null
  } catch {
    return null
  }
}

export function localPostAutosaves(
  storage: Storage,
  prefix: string,
  documentKey: string
) {
  const entries: { key: string; record: PostAutosaveRecord }[] = []
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key || (key !== prefix && !key.startsWith(prefix + ":"))) continue
    const record = readLocalPostAutosave(storage.getItem(key), documentKey)
    if (record) entries.push({ key, record })
  }
  return entries.sort(
    (a, b) => Date.parse(b.record.savedAt) - Date.parse(a.record.savedAt)
  )
}
