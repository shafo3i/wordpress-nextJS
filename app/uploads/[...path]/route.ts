import { resolve } from 'node:path'
import { serveUploadResponse } from '@/deploy/uploads.mjs'

export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(request:Request) {
  return await serveUploadResponse(request,resolve(process.cwd(),'public/uploads')) || new Response(null,{status:404})
}
export const HEAD=GET
