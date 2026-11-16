import DOMPurify from 'isomorphic-dompurify'
import { safeMediaUrl, videoEmbedUrl, videoMarkup } from './post-media'

// Traverse sanitized nodes directly. Per-element CSS selector queries retain
// detached article documents in the server DOM implementation under repetition.
function elements(root: DocumentFragment | Element): Element[] {
  const walker = root.ownerDocument.createTreeWalker(root, 1)
  const result: Element[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) result.push(node as Element)
  return result
}

const mediaTags = new Set(['video', 'audio', 'iframe'])
function insideMedia(element: Element): boolean {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (mediaTags.has(node.localName)) return true
  }
  return false
}

/** Sanitize article HTML and upgrade standalone video links, including imported posts. */
export function renderPostMedia(content: string): string {
  const fragment = DOMPurify.sanitize(content.replace(/\[embed\]([^<\[]+)\[\/embed\]/gi, '<p>$1</p>'), {
    RETURN_DOM_FRAGMENT: true,
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'referrerpolicy', 'playsinline'],
    FORBID_TAGS: ['object', 'embed'],
  })
  for (const node of elements(fragment)) {
    if (node.localName !== 'p' && !node.classList.contains('wp-block-embed__wrapper')) continue
    if (insideMedia(node) || elements(node).some(child => child.localName === 'img' || mediaTags.has(child.localName))) continue
    const children = [...node.children]
    if (children.length && (children.length !== 1 || children[0].tagName !== 'A')) continue
    const value = children[0]?.getAttribute('href') || node.textContent?.trim() || ''
    if (children[0] && node.textContent?.trim() !== children[0].textContent?.trim()) continue
    const markup = videoMarkup(value)
    if (markup) node.innerHTML = markup
  }
  for (const iframe of elements(fragment).filter(node => node.localName === 'iframe')) {
    const markup = videoMarkup(iframe.getAttribute('src') || '')
    if (!videoEmbedUrl(iframe.getAttribute('src') || '') || !markup) { iframe.remove(); continue }
    const host = iframe.ownerDocument.createElement('div')
    host.innerHTML = markup
    iframe.replaceWith(host.firstElementChild!)
  }
  for (const media of elements(fragment).filter(node => node.localName === 'video' || node.localName === 'audio')) {
    for (const source of [media, ...elements(media).filter(node => node.localName === 'source')]) {
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
