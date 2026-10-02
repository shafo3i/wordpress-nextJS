import { NextRequest } from "next/server";
import { GET as getFeed } from "@/app/feed/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return getFeed(request);
}
