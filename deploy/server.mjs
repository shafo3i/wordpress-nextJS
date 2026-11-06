import next from "next"
import { createServer } from "node:http"
import { resolve } from "node:path"
import { serveUpload } from "./uploads.mjs"

const hostname = process.env.HOSTNAME || "0.0.0.0"
const port = Number(process.env.PORT || 3000)
const app = next({ dev: false, hostname, port })
await app.prepare()
const handle = app.getRequestHandler()
const uploads = resolve("public/uploads")
const server = createServer(async (req, res) => {
  try {
    if (await serveUpload(req, res, uploads)) return
    await handle(req, res)
  } catch {
    if (!res.headersSent) res.writeHead(500)
    res.end()
  }
})
server.listen(port, hostname)
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  const timeout = setTimeout(() => process.exit(1), 10000).unref()
  server.close(async () => {
    await app.close()
    clearTimeout(timeout)
    process.exit(0)
  })
}
process.on("SIGTERM", stop)
process.on("SIGINT", stop)
