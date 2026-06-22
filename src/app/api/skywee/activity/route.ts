/**
 * GET /api/skywee/activity
 */
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

const VALID_MODULES = new Set([
  "agent-square",
  "aegis",
  "swarm-treasury",
  "rwa-vault",
  "carbon-guard",
])

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const moduleFilter = searchParams.get("module")
    const limitParam = searchParams.get("limit")
    const limit = Math.min(100, Math.max(1, parseInt(limitParam ?? "20", 10) || 20))

    const where = moduleFilter && VALID_MODULES.has(moduleFilter) ? { module: moduleFilter } : {}

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return ok({
      transactions,
      count: transactions.length,
      block: 2_847_195,
    })
  } catch (e) {
    return err("Failed to fetch activity", 500, e instanceof Error ? e.message : String(e))
  }
}
