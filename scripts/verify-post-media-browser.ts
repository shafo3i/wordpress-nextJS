import 'dotenv/config'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import en from '../templates/language/en.json'
import ar from '../templates/language/ar.json'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const context = await browser.newContext({ baseURL: 'http://localhost:3000', viewport: { width:1440, height:1100 } })
  const credentials = JSON.parse(await readFile('.local/wordpress-migration/admin-credentials.json', 'utf8'))
  const response = await context.request.post('/api/auth/sign-in/email', { headers:{ Origin:'http://localhost:3000' }, data:{ email:credentials.email, password:credentials.password } })
  assert.equal(response.status(), 200)
  assert(!(await response.json()).twoFactorRedirect, 'MFA challenge required; do not bypass')
  const page = await context.newPage()
  page.setDefaultTimeout(90000)
  let blockedWrites = 0
  await page.route('**/admincp/posts/new**', async route => {
    if (route.request().method() === 'POST') {
      const body = route.request().postData() || ''
      // Only the read-only paginated library action may run in this check.
      if (!body.includes('"perPage":40')) { blockedWrites++; await route.abort(); return }
    }
    await route.continue()
  })
  for (const [locale, dict] of [['en',en], ['ar',ar]] as const) {
    await context.addCookies([{ name:'admin_lang', value:locale, url:'http://localhost:3000' }])
    assert.equal((await page.goto('/admincp/posts/new', { waitUntil:'domcontentloaded', timeout:180000 }))?.status(), 200)
    await page.getByRole('button', { name:dict['admin.editor.set_featured_image'] }).click()
    const dialog = page.getByRole('dialog', { name:dict['admin.editor.set_featured_image'], exact:true })
    await dialog.locator('img').first().waitFor().catch(async error => {
      console.log('Media dialog state:', (await dialog.innerText()).slice(0,600), 'blocked writes:', blockedWrites)
      await page.screenshot({path:'.local/wordpress-migration/post-media-browser.png'})
      throw error
    })
    const first = await dialog.locator('img').first().getAttribute('src')
    await dialog.getByRole('button', { name:dict['admin.media.next_page'], exact:true }).click()
    await page.waitForFunction(({first}) => {
      const image = document.querySelector('[role="dialog"] img')
      return image && image.getAttribute('src') !== first
    }, {first})
    await dialog.locator('button').filter({has:page.locator('img')}).first().click()
    await dialog.getByRole('button', { name:dict['admin.editor.set_featured_image'], exact:true }).click()
    assert(await page.locator('[name="featuredImageId"]').inputValue())
    await page.getByRole('button', { name:dict['admin.editor.add_media'], exact:true }).click()
    const insert = page.getByRole('dialog', { name:dict['admin.editor.add_media'], exact:true })
    await insert.locator('img').first().waitFor()
    await insert.locator('button').filter({has:page.locator('img')}).first().click()
    await insert.getByRole('button', { name:dict['admin.editor.insert_media'], exact:true }).click()
    await page.waitForFunction(() => !!(window as any).tinymce?.activeEditor?.getContent().includes('<img'))
    await page.getByRole('button', { name:dict['admin.editor.insert_video'], exact:true }).click()
    const media = page.locator('.tox-dialog')
    await media.getByRole('textbox', {name:dict['admin.editor.video_url'],exact:true}).fill('https://youtu.be/dQw4w9WgXcQ')
    await media.getByRole('button', { name:dict['admin.editor.insert_media'], exact:true }).click()
    await page.waitForFunction(() => (window as any).tinymce?.activeEditor?.getContent().includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'))
    const sandbox = await page.evaluate(() => (window as any).tinymce.activeEditor.getDoc().querySelector('iframe[src*="youtube-nocookie.com"]')?.getAttribute('sandbox'))
    assert.equal(sandbox, null, 'Trusted YouTube editor preview must allow its player scripts')
    const previewSandbox = await page.evaluate(() => {
      const editor = (window as any).tinymce.activeEditor
      editor.setContent('<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" sandbox=""></iframe><iframe src="https://example.test/untrusted"></iframe>')
      return [...editor.getDoc().querySelectorAll('iframe')].map((frame:any) => ({src:frame.getAttribute('src'),sandbox:frame.getAttribute('sandbox')}))
    })
    assert.equal(previewSandbox.find(frame=>frame.src?.includes('youtube-nocookie.com'))?.sandbox,null,'Previously saved trusted embeds must recover their editor preview')
    assert.equal(previewSandbox.find(frame=>frame.src?.includes('example.test'))?.sandbox,'','Untrusted frames must remain sandboxed')
    for (const [source, expected] of [['https://vimeo.com/12345678/abc123', 'player.vimeo.com/video/12345678?h=abc123'], ['/uploads/post-media-check.mp4', '<video']] as const) {
      await page.getByRole('button', {name:dict['admin.editor.insert_video'],exact:true}).click()
      await media.getByRole('textbox', {name:dict['admin.editor.video_url'],exact:true}).fill(source)
      await media.getByRole('button', {name:dict['admin.editor.insert_media'],exact:true}).click()
      await page.waitForFunction(value => (window as any).tinymce?.activeEditor?.getContent().includes(value), expected)
    }
    console.log(`Post media browser checks passed (${locale}): second-page featured image, media insertion, YouTube, Vimeo and native video markup. No post saved.`)
  }
  assert.equal(blockedWrites, 0)
  await context.request.post('/api/auth/sign-out', { headers:{Origin:'http://localhost:3000'}, data:{} })
  await context.close()
} finally { await browser.close() }
