/**
 * GET /api/skywee/network/blocks?limit=5
 *   Returns latest blocks from CSPR.cloud.
 */
import { NextRequest } from "next/server"
import { getLatestBlocks } from "@/lib/skywee/cspr-cloud"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10) || 5))
    const blocks = await getLatestBlocks(limit)
    return ok({ blocks, count: blocks.length })
  } catch (e) {
    return err("Failed to fetch blocks", 500, e instanceof Error ? e.message : String(e))
  }
}
