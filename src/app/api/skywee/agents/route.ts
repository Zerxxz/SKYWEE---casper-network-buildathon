/**
 * GET /api/skywee/agents
 *   List all registered agents.
 */
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      orderBy: { onChainId: "asc" },
    })
    return ok({ agents, count: agents.length })
  } catch (e) {
    return err("Failed to fetch agents", 500, e instanceof Error ? e.message : String(e))
  }
}
