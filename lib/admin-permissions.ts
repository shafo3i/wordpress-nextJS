/** Module access policy; mutations must still call the relevant server guard. */
export function canAccessAdminPath(role: string | null | undefined, pathname: string) {
  if (role === "admin") return true
  return role === "editor" && /^\/admincp\/(?:posts(?:\/new|\/[1-9]\d*\/edit)?|media|tags(?:\/[1-9]\d*\/edit)?|categories)\/?$/.test(pathname)
}
