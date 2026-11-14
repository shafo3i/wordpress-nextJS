/** Spreadsheet formula controls apply to headers and data, including legacy rows. */
export function newsletterCsvCell(value: string): string {
  const unsafe = /^[\u0000-\u0020\uFEFF]*[=+@-]|^[\t\r\n]/.test(value)
  return '"' + (unsafe ? "'" : "") + value.replaceAll('"', '""') + '"'
}
