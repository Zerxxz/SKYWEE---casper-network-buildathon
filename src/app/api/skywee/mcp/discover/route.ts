/**
 * POST /api/skywee/mcp/discover
 *
 * Body: McpDiscoveryQuery
 *   capability?: AgentCapability
 *   minReputation?: number
 *   maxPriceCSPR?: number
 *   activeOnly?: boolean
 *   sortBy?: "reputation" | "price" | "requests" | "latency"
 *   limit?: number
 *
 * Returns: McpDiscoveryResponse
 *
 * Forwards to the Casper MCP server if CASPER_MCP_SERVER_URL is set.
 * Falls back to simulation otherwise.
 */
import { NextRequest } from "next/server"
import { discoverAgents, type McpDiscoveryQuery, type AgentCapability } from "@/lib/skywee/casper-mcp"
import { ok, err, readJson } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

const VALID_CAPS = new Set<AgentCapability>([
  "risk-scorer",
  "yield-router",
  "compliance",
  "executor",
  "oracle",
  "market-maker",
  "verifier",
  "treasurer",
])

const VALID_SORT = new Set(["reputation", "price", "requests", "latency"])

export async function POST(req: NextRequest) {
  try {
    const body = await readJson<McpDiscoveryQuery>(req) ?? {}

    // Validate
    if (body.capability && !VALID_CAPS.has(body.capability)) {
      return err(`capability must be one of: ${[...VALID_CAPS].join(", ")}`, 400)
    }
    if (body.sortBy && !VALID_SORT.has(body.sortBy)) {
      return err(`sortBy must be one of: ${[...VALID_SORT].join(", ")}`, 400)
    }
    if (body.minReputation !== undefined && (body.minReputation < 0 || body.minReputation > 100)) {
      return err("minReputation must be 0-100", 400)
    }

    const query: McpDiscoveryQuery = {
      capability: body.capability,
      minReputation: body.minReputation,
      maxPriceCSPR: body.maxPriceCSPR,
      activeOnly: body.activeOnly ?? true,
      sortBy: body.sortBy,
      limit: Math.min(100, Math.max(1, body.limit ?? 20)),
    }

    const result = await discoverAgents(query)
    return ok(result)
  } catch (e) {
    return err("MCP discovery failed", 500, e instanceof Error ? e.message : String(e))
  }
}

/**
 * Also support GET with query string params for easy browser testing.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query: McpDiscoveryQuery = {
      capability: searchParams.get("capability") as AgentCapability | undefined,
      minReputation: searchParams.get("minReputation")
        ? parseInt(searchParams.get("minReputation")!, 10)
        : undefined,
      maxPriceCSPR: searchParams.get("maxPriceCSPR")
        ? parseFloat(searchParams.get("maxPriceCSPR")!)
        : undefined,
      activeOnly: searchParams.get("activeOnly") !== "false",
      sortBy: searchParams.get("sortBy") as McpDiscoveryQuery["sortBy"],
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : 20,
    }

    const result = await discoverAgents(query)
    return ok(result)
  } catch (e) {
    return err("MCP discovery failed", 500, e instanceof Error ? e.message : String(e))
  }
}
