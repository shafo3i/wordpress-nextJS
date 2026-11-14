export function sanitizeCustomCss(css: string | undefined): string {
  if (typeof css !== "string" || css.length > 20_000) return ""
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "")
  // Conservative policy: no HTML delimiters, CSS escapes, external loads or legacy executable declarations.
  if (
    /[<>\\]/.test(clean) ||
    /@(?:import|namespace|charset)\b|(?:url|image|image-set|-webkit-image-set)\s*\(|expression\s*\(|(?:behavior|-moz-binding)\s*:/i.test(
      clean
    )
  )
    return ""
  return clean
}
