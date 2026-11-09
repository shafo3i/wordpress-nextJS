import { describe, expect, it, vi } from 'vitest'
const { hooks, posts } = vi.hoisted(() => ({ hooks: [] as Array<(content: string, context: unknown) => Promise<string>>, posts: vi.fn() }))
vi.mock('@/lib/plugins/hooks', () => ({ addFilter: (_name: string, callback: typeof hooks[number]) => hooks.push(callback) }))
vi.mock('@/lib/plugins/config', () => ({ getPluginConfig: async () => ({ count: 3 }) }))
vi.mock('@/lib/site-content', () => ({ getPublishedPosts: posts }))
import { init } from '@/plugins/related-posts/index'

describe('related post localization', () => {
  it('uses the article locale, translated heading, localized URLs and escaped content', async () => {
    init()
    posts.mockResolvedValue([{ slug:'story', title:'<img src=x onerror=bad()>', categories:['<script>bad</script>'] }])
    const html = await hooks[0]('<p>Article</p>', { article:{ slug:'current', locale:'ar', categories:[] }, theme:{ locale:'ar', defaultLocale:'en', dict:{ 'site.related_posts.heading':'أخبار ذات صلة' } } })
    expect(posts).toHaveBeenCalledWith(10, 'ar')
    expect(html).toContain('أخبار ذات صلة')
    expect(html).toContain('href="/ar/posts/story"')
    expect(html).not.toContain('Recommended')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })
})
