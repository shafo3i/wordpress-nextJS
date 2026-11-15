import { createRoot } from "react-dom/client"
import { SiteHealthView } from "../../app/(admin)/admincp/tools/site-health/_components/site-health-view"
import { MediaToolsView } from "../../app/(admin)/admincp/tools/media/_components/media-tools-view"
import en from "../../templates/language/en.json"
import ar from "../../templates/language/ar.json"
import type { SiteHealthData } from "../../services/database-maintenance.service"
export function render(locale: "en" | "ar") {
  const dict = locale === "ar" ? ar : en
  const health: SiteHealthData = {
    database: {
      version: "PostgreSQL 17",
      size: "1 MB",
      serverTime: "2026-11-15",
      totalTables: 20,
      activeConnections: 2,
      status: "good",
    },
    server: {
      nodeVersion: "24",
      platform: "fixture",
      arch: "x64",
      uptime: "1h",
      memoryHeapUsed: "10 MB",
      memoryHeapTotal: "20 MB",
      memoryRss: "30 MB",
    },
    storage: {
      uploadsDir: "public/uploads",
      exists: true,
      writable: true,
      fileCount: null,
      totalSize: null,
      diskFree: "10 GB",
      diskTotal: "20 GB",
      scannedAt: null,
    },
    security: {
      https: true,
      envConfigured: true,
      nodeEnv: "test",
      dbSsl: true,
    },
  }
  const stats = {
    attachmentCount: 3,
    physicalFilesCount: null,
    totalDiskUsageBytes: null,
    scannedAt: null,
    uploadsDirWritable: true,
    configuredSizes: [],
  }
  Object.assign(globalThis, {
    storageCalls: { health: 0, scanHealth: 0, scanMedia: 0, regenerate: 0, orphans: 0 },
    storageHealth: health,
    storageStats: stats,
    storageError: dict["admin.tools.error.failed"],
  })
  createRoot(document.getElementById("fixture")!).render(
    <main dir={locale === "ar" ? "rtl" : "ltr"}>
      <section data-health>
        <SiteHealthView data={health} dict={dict} />
      </section>
      <section data-media>
        <MediaToolsView
          initialStats={stats}
          dict={dict}
          direction={locale === "ar" ? "rtl" : "ltr"}
        />
      </section>
    </main>
  )
}
