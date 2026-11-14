import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { attachmentMarkup, videoEmbedUrl, videoMarkup } from '@/lib/post-media'
import { renderPostMedia } from '@/lib/post-content-media'
import { validateVideoUpload } from '@/lib/media-upload'

describe('post videos', () => {
  it('serves the installed patched TinyMCE version in the browser', () => {
    const digest = (path: string) => createHash('sha256').update(readFileSync(path, 'utf8').replace(/\r\n/g, '\n')).digest('hex')
    for (const file of ['tinymce.min.js', 'plugins/media/plugin.min.js']) {
      expect(digest(`public/tinymce/${file}`)).toBe(digest(`node_modules/tinymce/${file}`))
    }
  })
  it('canonicalizes YouTube links, shorts and timestamps without arbitrary hosts', () => {
    expect(videoEmbedUrl('https://youtu.be/dQw4w9WgXcQ?t=42s')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=42')
    expect(videoEmbedUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toContain('/embed/dQw4w9WgXcQ')
    for (const url of ['https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'https://evil.test', 'https://user@youtube.com/watch?v=dQw4w9WgXcQ']) expect(videoEmbedUrl(url)).toBeNull()
  })
  it('retains Vimeo unlisted hashes', () => {
    expect(videoEmbedUrl('https://vimeo.com/12345678/abc123')).toBe('https://player.vimeo.com/video/12345678?h=abc123')
    expect(videoEmbedUrl('https://player.vimeo.com/video/12345678?h=abc123')).toContain('?h=abc123')
  })
  it('renders standalone links but leaves editorial links in sentences intact', () => {
    const output = renderPostMedia('<p>https://youtu.be/dQw4w9WgXcQ</p><p><a href="/uploads/2026/movie.mp4">Watch</a></p><p>See <a href="https://vimeo.com/12345678">our interview</a> here.</p>')
    expect(output).toContain('<iframe')
    expect(output).toContain('<video')
    expect(output).toContain('our interview</a> here.')
    expect(renderPostMedia('<div class="wp-block-embed__wrapper">https://vimeo.com/12345678</div>')).toContain('<iframe')
    expect(renderPostMedia('[embed]https://vimeo.com/12345678[/embed]')).toContain('<iframe')
  })
  it('rejects iframe injection, unsafe protocols, srcdoc and event handlers', () => {
    const output = renderPostMedia('<iframe src="https://evil.test" srcdoc="<script>x</script>"></iframe><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" onload="alert(1)" srcdoc="bad"></iframe><video autoplay src="javascript:alert(1)" onerror="bad()"><source src="data:text/html,bad"></video><script>bad()</script>')
    expect(output).not.toMatch(/evil\.test|srcdoc|onload|onerror|javascript:|data:|<script|autoplay/)
    expect(output).toContain('youtube-nocookie.com')
    expect(output).toContain('controls=""')
  })
  it('inserts media with escaped attributes and native controls', () => {
    expect(attachmentMarkup({url:'/uploads/video.mp4', mimeType:'video/mp4', title:'video'})).toContain('<video controls')
    expect(attachmentMarkup({url:'/uploads/audio.mp3', mimeType:'audio/mpeg', title:'audio'})).toContain('<audio controls')
    expect(attachmentMarkup({url:'/uploads/a.png', mimeType:'image/png', title:'image', altText:'" onerror="bad'})).toContain('&quot; onerror=&quot;bad')
    expect(videoMarkup('javascript:bad.mp4')).toBeNull()
    expect(videoMarkup('//evil.test/a.mp4')).toBeNull()
  })
  it('checks video extension, MIME and container signatures', () => {
    expect(() => validateVideoUpload('a.mp4','video/mp4',new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0,105,115,111,109,109,112,52,50]))).not.toThrow()
    expect(() => validateVideoUpload('a.webm','video/webm',new Uint8Array([26,69,223,163,0,0,119,101,98,109,0,0]))).not.toThrow()
    expect(() => validateVideoUpload('a.html','video/mp4',new Uint8Array([1]))).toThrow()
    expect(() => validateVideoUpload('a.mp4','text/html',new Uint8Array([1]))).toThrow()
    expect(() => validateVideoUpload('a.mp4','video/mp4',new Uint8Array([1]))).toThrow()
  })
})
