import { postDateFilterSchema } from "@/db/schema/cms-post-filters"

export function getPostDateBounds(input: unknown, now = new Date()) {
  const parsed = postDateFilterSchema.safeParse(input)
  if (!parsed.success) return { valid: false as const }
  const { date, from, to } = parsed.data
  const utc = (value: string) => new Date(`${value}T00:00:00.000Z`)
  const nextDay = (value: string) => {
    const result = utc(value)
    result.setUTCDate(result.getUTCDate() + 1)
    return result
  }
  if (date === "range")
    return {
      valid: true as const,
      start: from ? utc(from) : undefined,
      end: to ? nextDay(to) : undefined,
    }
  if (date === "today") {
    const today = now.toISOString().slice(0, 10)
    return { valid: true as const, start: utc(today), end: nextDay(today) }
  }
  const month = date === "month" ? now.toISOString().slice(0, 7) : date
  if (/^[1-9]\d{3}-\d{2}$/.test(month)) {
    const start = utc(`${month}-01`),
      end = new Date(start)
    end.setUTCMonth(end.getUTCMonth() + 1)
    return { valid: true as const, start, end }
  }
  return { valid: true as const, start: undefined, end: undefined }
}
