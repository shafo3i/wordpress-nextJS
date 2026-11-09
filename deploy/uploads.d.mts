import type { IncomingMessage, ServerResponse } from 'node:http'
export function serveUpload(req:IncomingMessage,res:ServerResponse,directory:string):Promise<boolean>
export function serveUploadResponse(request:Request,directory:string):Promise<Response|null>
