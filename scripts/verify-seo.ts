import 'dotenv/config'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { getPublishedPosts } from '../lib/site-content'
import { getSeoSite } from '../lib/seo/data'
import { contentUrl } from '../lib/seo/urls'
import { indexingAllowed } from '../lib/seo/metadata'
import { pool } from '../db'
import { writeFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import sharp from 'sharp'

const base=process.env.SEO_VERIFY_URL || 'http://localhost:3000'
assert(['localhost','127.0.0.1','::1'].includes(new URL(base).hostname),'Local verification only')
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
  const site=await getSeoSite()
  const context=await browser.newContext({baseURL:base,viewport:{width:390,height:844},isMobile:true})
  await context.route('**/api/posts/*/view',route=>route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'}))
  const page=await context.newPage();page.setDefaultTimeout(90000)
  for (const language of site.languages) {
    const [post]=await getPublishedPosts(1,language.code)
    if (!post) continue
    const path=new URL(contentUrl(site.base,'post',post.slug,language.code,site.defaultLocale)).pathname
    const response=await page.goto(path,{waitUntil:'domcontentloaded',timeout:180000})
    assert.equal(response?.status(),200)
    await page.locator('article.prose').waitFor()
    await page.waitForFunction(()=>!!document.querySelector('meta[property="og:type"][content="article"]'))
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href')
    if (site.options.seo_canonical_enabled!=='0') assert.equal(canonical,contentUrl(site.base,'post',post.slug,language.code,site.defaultLocale))
    assert.equal(await page.locator('html').getAttribute('lang'),language.code)
    assert.equal(await page.locator('html').getAttribute('dir'),language.direction)
    const schema=page.locator('script[type="application/ld+json"]')
    if (indexingAllowed(site.options,post.seo?.noindex)) {
      await schema.waitFor({state:'attached'})
      const data=JSON.parse((await schema.textContent())!)
      assert.equal(data['@type'],'NewsArticle');assert.equal(data.headline,post.title);assert.equal(data.inLanguage,language.code)
      assert.equal(data.datePublished,(post.publishedDate || post.date).toISOString())
    }
    assert(!(await page.title()).includes('undefined'))
    console.log(`Article SEO verified (${language.code}): canonical, social metadata, schema/indexing and document language.`)
  }
  for (const endpoint of ['/sitemap.xml','/news-sitemap.xml']) {
    const response=await context.request.get(endpoint)
    assert.equal(response.status(),200)
    const xml=await response.text();assert.equal(XMLValidator.validate(xml),true)
    const parsed=new XMLParser({ignoreAttributes:false}).parse(xml)
    const urls=parsed.urlset?.url ? (Array.isArray(parsed.urlset.url) ? parsed.urlset.url : [parsed.urlset.url]) : []
    for (const item of urls) {
      assert.equal(new URL(item.loc).origin,new URL(site.base).origin)
      if (item['news:news']) {
        const news=item['news:news'];const date=new Date(news['news:publication_date']).getTime()
        assert(date<=Date.now() && date>=Date.now()-48*60*60*1000-60000)
        assert(site.languages.some(language=>language.code===news['news:publication']['news:language']))
      }
    }
    console.log(`${endpoint}: valid XML (${urls.length} URLs in root response).`)
  }
  for (const url of ['https://127.0.0.1/private.jpg','/api/auth/get-session','/uploads/../api/private.jpg']) {
    const response=await context.request.get(`/_next/image?${new URLSearchParams({url,w:'640',q:'75'})}`)
    assert.equal(response.status(),400,'Image optimizer must reject non-upload sources')
  }
  assert.equal((await context.request.get('/news-sitemap/invalid.xml')).status(),404)
  const filename=`seo-live-upload-${randomUUID()}.png`
  const file=resolve('public/uploads',filename)
  let created=false
  try {
    await writeFile(file,await sharp({create:{width:4,height:4,channels:3,background:'#fff'}}).png().toBuffer(),{flag:'wx'})
    created=true
    const optimized=await context.request.get(`/_next/image?${new URLSearchParams({url:`/uploads/${filename}`,w:'640',q:'75'})}`,{headers:{Accept:'image/webp'},timeout:90000})
    assert.equal(optimized.status(),200,'A file created after server startup must optimize without restarting')
    assert(optimized.headers()['content-type']?.startsWith('image/'))
    console.log('Image optimization verified for a file created after server startup; source fixture removed.')
  } finally {if (created) await unlink(file)}
  assert.equal((await context.request.get('/sitemaps/invalid.xml')).status(),404)
  await context.close()
} finally {await browser.close();await pool.end()}
