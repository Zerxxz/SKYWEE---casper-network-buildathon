/**
 * GET /api/skywee/mcp/stats
 *   Returns aggregate agent economy stats from MCP.
 */
import { getAgentEconomyStats } from "@/lib/skywee/casper-mcp"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const stats = await getAgentEconomyStats()
    return ok(stats)
  } catch (e) {
    return err("Failed to fetch MCP stats", 500, e instanceof Error ? e.message : String(e))
  }
}
