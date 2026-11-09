import 'dotenv/config'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { getCustomizerData } from '../lib/themes/customizer'
import { pool } from '../db'

const browser = await chromium.launch({channel:'msedge',headless:true})
try {
  const data = await getCustomizerData()
  const key = `theme_mods_${data.themeSlug}`
  const before = await pool.query('select md5(option_value) as hash from wp_options where option_name=$1',[key])
  const context = await browser.newContext({baseURL:'http://localhost:3000',viewport:{width:1440,height:1100}})
  const credentials = JSON.parse(await readFile('.local/wordpress-migration/admin-credentials.json','utf8'))
  const login = await context.request.post('/api/auth/sign-in/email',{headers:{Origin:'http://localhost:3000'},data:{email:credentials.email,password:credentials.password}})
  assert.equal(login.status(),200)
  assert(!(await login.json()).twoFactorRedirect,'MFA challenge must not be bypassed')
  const page = await context.newPage()
  page.setDefaultTimeout(90000)
  await page.goto(`/customize-preview?theme=${encodeURIComponent(data.themeSlug)}&lang=ar`,{waitUntil:'networkidle',timeout:180000})
  const apply = async (preview: 'single'|'category', mods: Record<string,unknown>) => {
    await page.evaluate(state => window.postMessage({type:'customizer:state',state},window.location.origin), {page:preview,mods:{...data.mods,...mods},siteTitle:data.siteTitle,siteTagline:data.siteTagline})
  }
  for (const layout of ['sidebar-left','sidebar-right','full-container','centered']) {
    for (const enabled of [false,true]) {
      await apply('single',{singleLayout:layout,singleShowFeaturedImage:true,singleContentBorder:enabled,singleImageBorder:enabled,singleDividerBorders:enabled})
      await page.waitForFunction(enabled => {
        const article = document.querySelector('[data-single-article] article.prose')
        const image = document.querySelector('[data-article-image]')
        const divider = document.querySelector('[data-article-divider]')
        return article && image && divider && getComputedStyle(article).borderTopWidth === (enabled?'1px':'0px') && getComputedStyle(image).borderTopWidth === (enabled?'1px':'0px') && getComputedStyle(divider).borderBottomWidth === (enabled?'1px':'0px')
      },enabled)
      if (!enabled) assert.equal(await page.locator('article.prose').evaluate(node=>getComputedStyle(node).boxShadow),'none')
    }
  }
  for (const enabled of [false,true]) {
    await apply('category',{archiveBorder:enabled,archiveContentBorder:enabled,archiveDividerBorders:enabled})
    await page.waitForFunction(enabled => {
      const main = document.querySelector('[data-category-archive] main')
      const card = main?.querySelector('article')
      const divider = document.querySelector('[data-archive-divider]')
      return main && card && divider && getComputedStyle(main).borderTopWidth === (enabled?'1px':'0px') && getComputedStyle(card).borderTopWidth === (enabled?'1px':'0px') && getComputedStyle(divider).borderBottomWidth === (enabled?'1px':'0px')
    },enabled)
  }
  assert.deepEqual((await pool.query('select md5(option_value) as hash from wp_options where option_name=$1',[key])).rows,before.rows)
  await context.request.post('/api/auth/sign-out',{headers:{Origin:'http://localhost:3000'},data:{}})
  await context.close()
  console.log('Content border preview passed: four article layouts, image/header borders, archive outer/card/divider borders, and shadows. Saved theme settings unchanged.')
} finally {await browser.close();await pool.end()}
