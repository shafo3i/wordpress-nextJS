export function generateStudioId(prefix = "el"): string {
  const value =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint32Array(4)), (part) =>
          part.toString(16).padStart(8, "0")
        ).join("")
  return `${prefix}-${value}`
}
