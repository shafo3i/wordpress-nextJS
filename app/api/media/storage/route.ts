import { verifyPostEditor } from "@/lib/authMIddleware"
import { isS3UploadAvailable } from "@/services/media-storage.service"
export async function GET() {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }
  try {
    await verifyPostEditor()
    return Response.json({ s3: await isS3UploadAvailable() }, { headers })
  } catch { return Response.json({ s3: false }, { status: 403, headers }) }
}
