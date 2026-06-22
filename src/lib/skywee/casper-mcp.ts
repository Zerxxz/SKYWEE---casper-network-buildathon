/**
 * Casper MCP (Model Context Protocol) integration.
 *
 * MCP is the open standard that lets AI agents query blockchain state via
 * a structured protocol. The Casper MCP server exposes:
 *   - Agent registry state (registered agents, capabilities, reputation)
 *   - Account / deploy / block queries
 *   - Smart contract reads (entry points, named keys, dictionary lookups)
 *
 * In production, MCP servers run as separate processes that AI agents
 * connect to (via stdio or HTTP). SKYWEE's MCP client here demonstrates
 * the discovery flow: an agent calls MCP to find available SKYWEE agents
 * matching a capability filter, then composes a request to the chosen
 * agent via x402 payment.
 *
 * Architecture:
 *
 *   AI Agent (LLM) → MCP Client → MCP Server → Casper RPC → on-chain state
 *                       ↑
 *                       └─ SKYWEE uses this layer to discover agents
 *
 * In this prototype, the MCP server is simulated server-side (since we
 * can't run a real MCP process in the sandbox). When deployed, the
 * `MCP_SERVER_URL` env var points to the real MCP server endpoint,
 * and queries are forwarded.
 */

// =========================================================================
// Types — mirror the MCP request/response shape
// =========================================================================

export interface McpAgent {
  /** On-chain agent ID (u32 from the Odra contract) */
  id: number
  name: string
  role: AgentCapability
  reputation: number
  pricePerRequestCSPR: number
  requestsFulfilled: number
  active: boolean
  ownerAddress: string
  /** Capabilities this agent advertises via MCP */
  capabilities: string[]
  /** Average response latency in ms (last 100 requests) */
  avgLatencyMs: number
  /** Success rate over last 100 requests (0-1) */
  successRate: number
}

export type AgentCapability =
  | "risk-scorer"
  | "yield-router"
  | "compliance"
  | "executor"
  | "oracle"
  | "market-maker"
  | "verifier"
  | "treasurer"

export interface McpDiscoveryQuery {
  /** Filter by capability */
  capability?: AgentCapability
  /** Minimum reputation (0-100) */
  minReputation?: number
  /** Maximum price per request in CSPR (use 0 for free/service agents) */
  maxPriceCSPR?: number
  /** Only return active agents */
  activeOnly?: boolean
  /** Sort order */
  sortBy?: "reputation" | "price" | "requests" | "latency"
  /** Limit results (default 20) */
  limit?: number
}

export interface McpDiscoveryResponse {
  agents: McpAgent[]
  total: number
  query: McpDiscoveryQuery
  /** Whether the response came from a live MCP server or simulation */
  source: "live" | "simulation"
  /** Time spent on the query (ms) */
  tookMs: number
  /** MCP server URL (if live) */
  serverUrl: string | null
}

// =========================================================================
// Configuration
// =========================================================================

const MCP_SERVER_URL = process.env.CASPER_MCP_SERVER_URL ?? ""
const MCP_TIMEOUT_MS = 5_000

// =========================================================================
// In-memory cache (15s TTL — discovery is expensive)
// =========================================================================

const CACHE_TTL_MS = 15_000
const cache = new Map<string, { ts: number; data: McpDiscoveryResponse }>()

function getCached(key: string): McpDiscoveryResponse | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.data
}

function setCached(key: string, data: McpDiscoveryResponse): void {
  cache.set(key, { ts: Date.now(), data })
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Discover SKYWEE agents matching the given query via the Casper MCP server.
 *
 * In live mode, this forwards to the MCP server at MCP_SERVER_URL.
 * In simulation mode, returns a curated list of agents that match the query.
 */
export async function discoverAgents(
  query: McpDiscoveryQuery,
): Promise<McpDiscoveryResponse> {
  const cacheKey = JSON.stringify(query)
  const cached = getCached(cacheKey)
  if (cached) return cached

  const start = Date.now()

  // Try live MCP server
  if (MCP_SERVER_URL) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS)

      const res = await fetch(`${MCP_SERVER_URL}/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
        signal: controller.signal,
        next: { revalidate: 15 },
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = (await res.json()) as McpDiscoveryResponse
        const response: McpDiscoveryResponse = {
          ...data,
          source: "live",
          serverUrl: MCP_SERVER_URL,
          tookMs: Date.now() - start,
        }
        setCached(cacheKey, response)
        return response
      }
    } catch (e) {
      console.warn("MCP server unreachable, falling back to simulation:", e instanceof Error ? e.message : String(e))
    }
  }

  // Simulation fallback
  const response = simulateDiscovery(query, Date.now() - start)
  setCached(cacheKey, response)
  return response
}

/**
 * Get details for a single agent by ID via MCP.
 */
export async function getAgentById(id: number): Promise<McpAgent | null> {
  const all = await discoverAgents({ limit: 100 })
  return all.agents.find((a) => a.id === id) ?? null
}

/**
 * Get aggregate stats about the agent economy via MCP.
 */
export async function getAgentEconomyStats(): Promise<{
  totalAgents: number
  activeAgents: number
  avgReputation: number
  totalRequests: number
  totalVolumeCSPR: number
  source: "live" | "simulation"
}> {
  const discovery = await discoverAgents({ limit: 100, activeOnly: false })
  const agents = discovery.agents
  return {
    totalAgents: agents.length,
    activeAgents: agents.filter((a) => a.active).length,
    avgReputation: agents.length > 0
      ? agents.reduce((s, a) => s + a.reputation, 0) / agents.length
      : 0,
    totalRequests: agents.reduce((s, a) => s + a.requestsFulfilled, 0),
    totalVolumeCSPR: agents.reduce((s, a) => s + a.requestsFulfilled * a.pricePerRequestCSPR, 0),
    source: discovery.source,
  }
}

// =========================================================================
// Simulation — produces realistic agent data when MCP server unavailable
// =========================================================================

const SIM_AGENTS: McpAgent[] = [
  {
    id: 1, name: "RYSK-7", role: "risk-scorer", reputation: 98, pricePerRequestCSPR: 0.42,
    requestsFulfilled: 14204, active: true, ownerAddress: "0x4f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    capabilities: ["risk-scoring", "portfolio-analysis", "var-calculation", "stress-testing"],
    avgLatencyMs: 142, successRate: 0.987,
  },
  {
    id: 2, name: "YLR-3", role: "yield-router", reputation: 95, pricePerRequestCSPR: 0.18,
    requestsFulfilled: 9873, active: true, ownerAddress: "0x91b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f",
    capabilities: ["yield-optimization", "amm-routing", "liquidity-discovery", "impermanent-loss-hedging"],
    avgLatencyMs: 89, successRate: 0.972,
  },
  {
    id: 3, name: "EXE-Max", role: "executor", reputation: 96, pricePerRequestCSPR: 0,
    requestsFulfilled: 6541, active: true, ownerAddress: "0x33c18a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8",
    capabilities: ["transaction-signing", "consensus-voting", "multisig-coordination"],
    avgLatencyMs: 312, successRate: 0.999,
  },
  {
    id: 4, name: "ORC-12", role: "oracle", reputation: 92, pricePerRequestCSPR: 0.31,
    requestsFulfilled: 21987, active: true, ownerAddress: "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e",
    capabilities: ["price-feeds", "weather-data", "gps-tracking", "iot-sensors", "flight-status"],
    avgLatencyMs: 67, successRate: 0.994,
  },
  {
    id: 5, name: "MM-Aria", role: "market-maker", reputation: 94, pricePerRequestCSPR: 0.12,
    requestsFulfilled: 8204, active: true, ownerAddress: "0x6dc702bb4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d",
    capabilities: ["dutch-auction", "amm-rebalancing", "demand-forecasting", "liquidity-management"],
    avgLatencyMs: 178, successRate: 0.961,
  },
  {
    id: 6, name: "VER-Gaia", role: "verifier", reputation: 99, pricePerRequestCSPR: 0.55,
    requestsFulfilled: 3492, active: true, ownerAddress: "0xf0381c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a",
    capabilities: ["satellite-imagery", "ndvi-analysis", "deforestation-detection", "iot-verification"],
    avgLatencyMs: 1240, successRate: 0.999,
  },
  {
    id: 7, name: "CMP-Vera", role: "compliance", reputation: 91, pricePerRequestCSPR: 0.38,
    requestsFulfilled: 5120, active: false, ownerAddress: "0x77a89d3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f",
    capabilities: ["kyc-verification", "aml-screening", "sanctions-check", "audit-trail"],
    avgLatencyMs: 456, successRate: 0.988,
  },
  {
    id: 8, name: "TRS-Odin", role: "treasurer", reputation: 97, pricePerRequestCSPR: 0,
    requestsFulfilled: 4889, active: true, ownerAddress: "0xc2d555b14a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d",
    capabilities: ["treasury-management", "rebalancing", "redemption", "yield-harvesting"],
    avgLatencyMs: 234, successRate: 0.996,
  },
]

function simulateDiscovery(query: McpDiscoveryQuery, tookMs: number): McpDiscoveryResponse {
  let agents = [...SIM_AGENTS]

  if (query.capability) {
    agents = agents.filter((a) => a.role === query.capability)
  }
  if (query.minReputation !== undefined) {
    agents = agents.filter((a) => a.reputation >= query.minReputation!)
  }
  if (query.maxPriceCSPR !== undefined) {
    agents = agents.filter((a) => a.pricePerRequestCSPR <= query.maxPriceCSPR!)
  }
  if (query.activeOnly) {
    agents = agents.filter((a) => a.active)
  }

  switch (query.sortBy) {
    case "reputation":
      agents.sort((a, b) => b.reputation - a.reputation)
      break
    case "price":
      agents.sort((a, b) => a.pricePerRequestCSPR - b.pricePerRequestCSPR)
      break
    case "requests":
      agents.sort((a, b) => b.requestsFulfilled - a.requestsFulfilled)
      break
    case "latency":
      agents.sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)
      break
  }

  const limit = query.limit ?? 20
  const total = agents.length
  agents = agents.slice(0, limit)

  return {
    agents,
    total,
    query,
    source: "simulation",
    tookMs,
    serverUrl: null,
  }
}

// =========================================================================
// Capability labels for UI
// =========================================================================

export const CAPABILITY_LABEL: Record<AgentCapability, string> = {
  "risk-scorer": "Risk Scoring",
  "yield-router": "Yield Routing",
  compliance: "Compliance / KYC",
  executor: "Transaction Execution",
  oracle: "Oracle / Data Feeds",
  "market-maker": "Market Making",
  verifier: "Verification / Satellite",
  treasurer: "Treasury Management",
}

export const CAPABILITY_DESCRIPTION: Record<AgentCapability, string> = {
  "risk-scorer": "Portfolio risk assessment, VaR calculation, stress testing",
  "yield-router": "AMM routing, yield optimization, IL hedging",
  compliance: "KYC/AML verification, sanctions screening, audit trails",
  executor: "Multi-sig transaction signing, consensus voting",
  oracle: "Price feeds, weather data, GPS tracking, IoT sensors",
  "market-maker": "Dutch auctions, AMM rebalancing, demand forecasting",
  verifier: "Satellite imagery, NDVI analysis, deforestation detection",
  treasurer: "Treasury rebalancing, redemption, yield harvesting",
}
