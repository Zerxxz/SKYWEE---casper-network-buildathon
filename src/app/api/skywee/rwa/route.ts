/**
 * GET /api/skywee/rwa
 */
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const assets = await db.rwaAsset.findMany({
      orderBy: { onChainId: "asc" },
    })
    return ok({ assets, count: assets.length })
  } catch (e) {
    return err("Failed to fetch RWA assets", 500, e instanceof Error ? e.message : String(e))
  }
}
