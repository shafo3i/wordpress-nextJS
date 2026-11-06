import assert from "node:assert/strict"
import { test } from "node:test"
import { createServer } from "node:http"
import {
  mkdtemp,
  mkdir,
  writeFile,
  unlink,
  rmdir,
  symlink,
} from "node:fs/promises"
import { resolve, join } from "node:path"
import { serveUpload } from "./uploads.mjs"

test("production uploads", async (t) => {
  const parent = resolve(".local/wordpress-migration")
  await mkdir(parent, { recursive: true })
  const fixture = await mkdtemp(join(parent, "uploads-runtime-"))
  const root = join(fixture, "public")
  await mkdir(root)
  await mkdir(join(root, ".quarantine"))
  const files = []
  async function file(path, value) {
    await writeFile(path, value)
    files.push(path)
  }
  await file(join(fixture, "outside.png"), "private")
  await file(join(root, ".quarantine", "secret.png"), "private")
  await file(join(root, "active.html"), "<script>alert(1)</script>")
  const server = createServer(async (req, res) => {
    if (!(await serveUpload(req, res, root))) {
      res.writeHead(404)
      res.end()
    }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(async () => {
    await new Promise((done) => server.close(done))
    for (const path of files.reverse()) await unlink(path)
    await rmdir(join(root, ".quarantine"))
    await rmdir(root)
    await rmdir(fixture)
  })
  await t.test("serves files created after startup", async () => {
    assert.equal((await fetch(base + "/uploads/new.png")).status, 404)
    await file(join(root, "new.png"), "abcdefgh")
    const response = await fetch(base + "/uploads/new.png")
    assert.equal(response.status, 200)
    assert.equal(await response.text(), "abcdefgh")
    assert.equal(response.headers.get("content-type"), "image/png")
    assert.equal(response.headers.get("x-content-type-options"), "nosniff")
  })
  await t.test("supports HEAD and video/audio-style byte ranges", async () => {
    const head = await fetch(base + "/uploads/new.png", { method: "HEAD" })
    assert.equal(head.headers.get("content-length"), "8")
    assert.equal(await head.text(), "")
    const part = await fetch(base + "/uploads/new.png", {
      headers: { Range: "bytes=2-4" },
    })
    assert.equal(part.status, 206)
    assert.equal(await part.text(), "cde")
    const suffix = await fetch(base + "/uploads/new.png", {
      headers: { Range: "bytes=-2" },
    })
    assert.equal(await suffix.text(), "gh")
    assert.equal(
      (
        await fetch(base + "/uploads/new.png", {
          headers: { Range: "bytes=80-90" },
        })
      ).status,
      416
    )
  })
  await t.test(
    "blocks traversal, encoded namespace bypasses and active/private files",
    async () => {
      for (const path of [
        "/uploads/%2e%2e%2foutside.png",
        "/uploads/.quarantine/secret.png",
        "/uploads%2f.quarantine%2fsecret.png",
        "/%75ploads/.quarantine/secret.png",
        "/uploads/active.html",
        "/uploads/%5c.quarantine%5csecret.png",
      ])
        assert.equal((await fetch(base + path)).status, 404, path)
      assert.equal((await fetch(base + "/uploads/%zz.png")).status, 400)
      assert.equal(
        (await fetch(base + "/uploads/new.png", { method: "POST" })).status,
        405
      )
    }
  )
  await t.test(
    "blocks symlinks escaping the uploads directory",
    async (test) => {
      const link = join(root, "link.png")
      try {
        await symlink(join(fixture, "outside.png"), link)
      } catch (error) {
        if (error.code === "EPERM")
          return test.skip("Symlink permission unavailable")
        throw error
      }
      files.push(link)
      assert.equal((await fetch(base + "/uploads/link.png")).status, 404)
      const privateLink = join(root, "private-link.png")
      await symlink(join(root, ".quarantine", "secret.png"), privateLink)
      files.push(privateLink)
      assert.equal(
        (await fetch(base + "/uploads/private-link.png")).status,
        404
      )
    }
  )
})
