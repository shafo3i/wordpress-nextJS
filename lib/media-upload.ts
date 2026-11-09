export const MAX_MEDIA_UPLOAD_BYTES = 32 * 1024 * 1024

/** Validate video containers as well as claimed MIME types before writing files. */
export function validateVideoUpload(name: string, mime: string, bytes: Uint8Array): void {
  const ext = name.split('.').pop()?.toLowerCase()
  const videoExtensions = ['mp4', 'm4v', 'webm', 'ogv']
  if (!mime.startsWith('video/') && !videoExtensions.includes(ext || '')) return
  const type = ({ mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg' } as Record<string, string>)[ext || '']
  if (!type || type !== mime) throw new Error('Unsupported video format')
  const signature = [...bytes.slice(0, 12)]
  const valid = type === 'video/mp4'
    ? String.fromCharCode(...signature.slice(4, 8)) === 'ftyp'
    : type === 'video/webm'
      ? signature.slice(0, 4).join(',') === '26,69,223,163'
      : String.fromCharCode(...signature.slice(0, 4)) === 'OggS'
  if (!valid) throw new Error('Invalid video container')
}
