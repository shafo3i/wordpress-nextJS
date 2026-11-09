import 'dotenv/config'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { getPublishedPosts } from '../lib/site-content'
import { getDefaultLanguage } from '../services/language.service'
import { pool } from '../db'
import en from '../templates/language/en.json'
import ar from '../templates/language/ar.json'

const browser = await chromium.launch({channel:'msedge',headless:true})
try {
  const defaultLocale = (await getDefaultLanguage())?.code
  const page = await browser.newPage({viewport:{width:1440,height:1000}})
  page.setDefaultTimeout(90000)
  for (const [locale,dict] of [['en',en],['ar',ar]] as const) {
    const [post] = await getPublishedPosts(1,locale)
    assert(post,'Existing published content is required for this read-only check')
    const query = post.title.split(/\s+/).find(word=>word.length>=3)!
    const prefix = locale === defaultLocale ? '' : `/${locale}`
    assert.equal((await page.goto(`http://localhost:3000${prefix || '/'}`,{waitUntil:'domcontentloaded',timeout:180000}))?.status(),200)
    const icon = page.getByRole('link',{name:dict['site.search.label'],exact:true})
    assert.equal(await icon.getAttribute('href'),`${prefix}/search`)
    await icon.click()
    await page.getByRole('heading',{name:dict['site.search.label'],exact:true}).waitFor()
    await page.getByRole('searchbox',{name:dict['site.search.label'],exact:true}).fill(query)
    await page.getByRole('button',{name:dict['site.search.submit'],exact:true}).click()
    await page.waitForURL(url=>url.searchParams.get('q')===query)
    await page.locator('main article').first().waitFor()
    assert(await page.locator('main').getByRole('link',{name:post.title,exact:true}).count())
    const next = page.locator(`main a[href*="page=2"]`)
    if (await next.count()) {
      await next.click()
      await page.waitForURL(url=>url.searchParams.get('page')==='2')
      assert.equal(new URL(page.url()).searchParams.get('q'),query)
      await page.locator('main article').first().waitFor()
    }
    assert.equal((await page.goto(`http://localhost:3000${prefix}/search?q=nonexistent-post-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:180000}))?.status(),200)
    await page.getByText(dict['site.search.empty'],{exact:true}).waitFor()
    assert.equal(await page.locator('main article').count(),0)
    console.log(`Public search browser checks passed (${locale}): menu link, query form, published result, pagination where available, and empty state.`)
  }
} finally {await browser.close();await pool.end()}
