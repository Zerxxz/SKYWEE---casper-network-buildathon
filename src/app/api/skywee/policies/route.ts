/**
 * GET /api/skywee/policies
 */
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const policies = await db.policy.findMany({
      orderBy: { onChainId: "asc" },
    })
    return ok({ policies, count: policies.length })
  } catch (e) {
    return err("Failed to fetch policies", 500, e instanceof Error ? e.message : String(e))
  }
}
