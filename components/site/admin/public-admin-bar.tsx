import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/auth"
import { getAdminLanguageContext } from "@/components/admin/admin-shell"
import { Gauge, Pencil, PanelsTopLeft } from "lucide-react"
import styles from "./public-admin-bar.module.css"

/** Session/role checks stay on the server; anonymous responses contain no admin UI. */
export async function PublicAdminBar({
  children,
  pageId,
  siteTitle,
}: {
  children: React.ReactNode
  pageId?: string
  siteTitle: string
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "editor")
  )
    return children
  const { dict, direction } = await getAdminLanguageContext()
  return (
    <div className={styles.scope}>
      <nav
        className={styles.bar}
        dir={direction === "rtl" ? "rtl" : "ltr"}
        aria-label={dict["site.admin_bar.label"]}
        data-public-admin-bar
      >
        <Link href="/admincp" className={styles.site}>
          <Gauge size={15} aria-hidden="true" />
          <span>{siteTitle}</span>
        </Link>
        <Link href="/admincp">{dict["site.admin_bar.dashboard"]}</Link>
        {pageId && (
          <>
            <Link href={`/admincp/pages/${pageId}/edit`}>
              <Pencil size={13} aria-hidden="true" />
              {dict["site.admin_bar.edit_page"]}
            </Link>
            <Link href={`/admincp/studio/${pageId}`}>
              <PanelsTopLeft size={13} aria-hidden="true" />
              {dict["site.admin_bar.edit_studio"]}
            </Link>
          </>
        )}
        <span className={styles.user}>{session.user.name}</span>
      </nav>
      <div className={styles.spacer} aria-hidden="true" />
      {children}
    </div>
  )
}
