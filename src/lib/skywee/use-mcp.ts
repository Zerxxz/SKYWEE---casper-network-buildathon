"use client"

import * as React from "react"

export type AgentCapability =
  | "risk-scorer"
  | "yield-router"
  | "compliance"
  | "executor"
  | "oracle"
  | "market-maker"
  | "verifier"
  | "treasurer"

export interface McpAgent {
  id: number
  name: string
  role: AgentCapability
  reputation: number
  pricePerRequestCSPR: number
  requestsFulfilled: number
  active: boolean
  ownerAddress: string
  capabilities: string[]
  avgLatencyMs: number
  successRate: number
}

export interface McpDiscoveryQuery {
  capability?: AgentCapability
  minReputation?: number
  maxPriceCSPR?: number
  activeOnly?: boolean
  sortBy?: "reputation" | "price" | "requests" | "latency"
  limit?: number
}

export interface McpDiscoveryResponse {
  agents: McpAgent[]
  total: number
  query: McpDiscoveryQuery
  source: "live" | "simulation"
  tookMs: number
  serverUrl: string | null
}

export interface McpEconomyStats {
  totalAgents: number
  activeAgents: number
  avgReputation: number
  totalRequests: number
  totalVolumeCSPR: number
  source: "live" | "simulation"
}

/**
 * Discover SKYWEE agents via Casper MCP.
 * Re-runs whenever the query changes.
 */
export function useMcpDiscovery(query: McpDiscoveryQuery) {
  const [response, setResponse] = React.useState<McpDiscoveryResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Serialize query for deps
  const queryKey = JSON.stringify(query)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)

    const run = async () => {
      try {
        const res = await fetch("/api/skywee/mcp/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: queryKey,
        })
        const json = await res.json()
        if (!cancelled) {
          if (json.ok) {
            setResponse(json.data)
            setError(null)
          } else {
            setError(json.error ?? "Discovery failed")
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [queryKey])

  return { response, loading, error }
}

/**
 * Aggregate economy stats from MCP.
 */
export function useMcpEconomyStats(pollMs = 30_000) {
  const [stats, setStats] = React.useState<McpEconomyStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    const tick = async () => {
      try {
        const res = await fetch("/api/skywee/mcp/stats")
        const json = await res.json()
        if (!cancelled && json.ok) {
          setStats(json.data)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    const id = setInterval(tick, pollMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [pollMs])

  return { stats, loading }
}
