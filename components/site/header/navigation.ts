import type { MenuItem } from "@/lib/menus/types"

export function getActiveNavigationId(
  items: MenuItem[],
  pathname: string
): string | undefined {
  const current = pathname.replace(/\/$/, "") || "/"
  return items
    .map((item) => ({
      item,
      path: item.url.split(/[?#]/)[0].replace(/\/$/, "") || "/",
    }))
    .filter(
      ({ item, path }) =>
        item.url.startsWith("/") &&
        !item.url.startsWith("//") &&
        (path === current || (path !== "/" && current.startsWith(`${path}/`)))
    )
    .sort((left, right) => right.path.length - left.path.length)[0]?.item.id
}
