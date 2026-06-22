/**
 * GET /api/skywee/proposals
 *   Returns proposals + their deliberation logs.
 */
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const proposals = await db.proposal.findMany({
      orderBy: { onChainId: "desc" },
      include: {
        deliberations: {
          orderBy: { round: "asc" },
        },
      },
    })
    return ok({ proposals, count: proposals.length })
  } catch (e) {
    return err("Failed to fetch proposals", 500, e instanceof Error ? e.message : String(e))
  }
}
