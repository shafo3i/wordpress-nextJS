import DOMPurify from 'isomorphic-dompurify'
import { safeMediaUrl, videoEmbedUrl, videoMarkup } from './post-media'

/** Sanitize article HTML and upgrade standalone video links, including imported posts. */
export function renderPostMedia(content: string): string {
  const fragment = DOMPurify.sanitize(content.replace(/\[embed\]([^<\[]+)\[\/embed\]/gi, '<p>$1</p>'), {
    RETURN_DOM_FRAGMENT: true,
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'referrerpolicy', 'playsinline'],
    FORBID_TAGS: ['object', 'embed'],
  })
  for (const node of fragment.querySelectorAll('p, .wp-block-embed__wrapper')) {
    if (node.closest('video, audio, iframe') || node.querySelector('img, video, audio, iframe')) continue
    const children = [...node.children]
    if (children.length && (children.length !== 1 || children[0].tagName !== 'A')) continue
    const value = children[0]?.getAttribute('href') || node.textContent?.trim() || ''
    if (children[0] && node.textContent?.trim() !== children[0].textContent?.trim()) continue
    const markup = videoMarkup(value)
    if (markup) node.innerHTML = markup
  }
  for (const iframe of fragment.querySelectorAll('iframe')) {
    const markup = videoMarkup(iframe.getAttribute('src') || '')
    if (!videoEmbedUrl(iframe.getAttribute('src') || '') || !markup) { iframe.remove(); continue }
    const host = iframe.ownerDocument.createElement('div')
    host.innerHTML = markup
    iframe.replaceWith(host.firstElementChild!)
  }
  for (const media of fragment.querySelectorAll('video, audio')) {
    for (const source of [media, ...media.querySelectorAll('source')]) {
      const raw = source.getAttribute('src')
      if (raw && !safeMediaUrl(raw)) source.removeAttribute('src')
    }
    media.removeAttribute('autoplay')
    media.setAttribute('controls', '')
    media.setAttribute('preload', 'metadata')
    media.setAttribute('style', 'width:100%;max-width:100%;height:auto')
  }
  const host = fragment.ownerDocument.createElement('div')
  host.append(fragment)
  return host.innerHTML
}
