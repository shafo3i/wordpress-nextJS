/** Provider URLs are canonicalized locally; no remote oEmbed requests are made. */
export function videoEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null
    const host = url.hostname.toLowerCase()
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1]
      if (!id || !/^[\w-]{11}$/.test(id)) return null
      const target = new URL(`https://www.youtube-nocookie.com/embed/${id}`)
      const start = url.searchParams.get('start') || url.searchParams.get('t')
      if (start && /^\d+s?$/.test(start)) target.searchParams.set('start', start.replace(/s$/, ''))
      return target.href
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
      const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/)
      if (!match) return null
      const target = new URL(`https://player.vimeo.com/video/${match[1]}`)
      const hash = url.searchParams.get('h') || match[2]
      if (hash && /^[a-zA-Z0-9]+$/.test(hash)) target.searchParams.set('h', hash)
      return target.href
    }
  } catch {}
  return null
}

export function safeMediaUrl(value: string): string | null {
  if (/^[\u0000-\u0020]|[\u0000-\u001f\\]/.test(value)) return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export function escapeMediaHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

export function videoMarkup(value: string): string | null {
  const embed = videoEmbedUrl(value)
  if (embed) return `<iframe src="${escapeMediaHtml(embed)}" title="${embed.includes('vimeo.com') ? 'Vimeo' : 'YouTube'}" width="640" height="360" style="width:100%;aspect-ratio:16/9;height:auto;border:0" loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
  const source = safeMediaUrl(value)
  if (!source || !/\.(?:mp4|webm|ogv|m4v)(?:[?#]|$)/i.test(source)) return null
  return `<video controls preload="metadata" playsinline style="width:100%;height:auto" src="${escapeMediaHtml(source)}"></video>`
}

export function attachmentMarkup(item: { url: string; mimeType: string; title: string; altText?: string }): string {
  const url = safeMediaUrl(item.url)
  if (!url) return ''
  const src = escapeMediaHtml(url)
  if (item.mimeType.startsWith('video/')) return `<video controls preload="metadata" playsinline style="width:100%;height:auto" src="${src}"></video>`
  if (item.mimeType.startsWith('audio/')) return `<audio controls preload="metadata" src="${src}"></audio>`
  if (item.mimeType.startsWith('image/')) return `<img src="${src}" alt="${escapeMediaHtml(item.altText || '')}" />`
  return `<a href="${src}">${escapeMediaHtml(item.title)}</a>`
}
