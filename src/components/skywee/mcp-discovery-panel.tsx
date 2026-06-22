"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Search, Filter, Clock, CheckCircle2, ExternalLink, Sparkles, Server } from "lucide-react"
import {
  useMcpDiscovery,
  useMcpEconomyStats,
  type McpAgent,
  type AgentCapability,
} from "@/lib/skywee/use-mcp"
import { CAPABILITY_LABEL, CAPABILITY_DESCRIPTION } from "@/lib/skywee/casper-mcp"
import { EXPLORER } from "@/lib/skywee/cspr-cloud"

const CAPABILITY_OPTIONS: AgentCapability[] = [
  "risk-scorer",
  "yield-router",
  "compliance",
  "executor",
  "oracle",
  "market-maker",
  "verifier",
  "treasurer",
]

const SORT_OPTIONS = [
  { value: "reputation", label: "Reputation" },
  { value: "price", label: "Price (low→high)" },
  { value: "requests", label: "Requests" },
  { value: "latency", label: "Latency" },
] as const

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="px-3 py-2 rounded-md skywee-hairline bg-foreground/[0.02]">
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold skywee-tabular">{value}</div>
      {hint && <div className="text-[9px] text-muted-foreground/70">{hint}</div>}
    </div>
  )
}

function AgentCard({ agent, index }: { agent: McpAgent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4 hover:bg-foreground/[0.04] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-md skywee-hairline bg-foreground/[0.04] grid place-items-center flex-shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground">
              {agent.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold truncate">{agent.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">#{agent.id}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {CAPABILITY_LABEL[agent.role]}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {agent.active ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground/10 text-foreground/80">
              <span className="skywee-pulse-dot h-1 w-1 rounded-full bg-foreground" /> Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground/[0.03] text-muted-foreground">
              Idle
            </span>
          )}
          <div className="text-[10px] font-mono skywee-tabular text-foreground/80">
            rep {agent.reputation}
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="mt-3 flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 4).map((cap) => (
          <span
            key={cap}
            className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-foreground/[0.04] border border-border rounded"
          >
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 4 && (
          <span className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
            +{agent.capabilities.length - 4} more
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-3 gap-3 text-[10px]">
        <div>
          <div className="text-muted-foreground/70 uppercase tracking-wider">Price</div>
          <div className="font-mono skywee-tabular text-foreground/80">
            {agent.pricePerRequestCSPR === 0 ? "Free" : `${agent.pricePerRequestCSPR} CSPR`}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1">
            <Clock size={8} /> Latency
          </div>
          <div className="font-mono skywee-tabular text-foreground/80">
            {agent.avgLatencyMs}ms
          </div>
        </div>
        <div>
          <div className="text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={8} /> Success
          </div>
          <div className="font-mono skywee-tabular text-foreground/80">
            {(agent.successRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground/70">
        <span>{agent.requestsFulfilled.toLocaleString()} requests</span>
        <a
          href={EXPLORER.account(agent.ownerAddress)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors inline-flex items-center gap-0.5"
        >
          {agent.ownerAddress.slice(0, 6)}…{agent.ownerAddress.slice(-4)}
          <ExternalLink size={8} />
        </a>
      </div>
    </motion.div>
  )
}

export function McpDiscoveryPanel() {
  const [capability, setCapability] = React.useState<AgentCapability | "">("")
  const [minRep, setMinRep] = React.useState("")
  const [maxPrice, setMaxPrice] = React.useState("")
  const [sortBy, setSortBy] = React.useState<"reputation" | "price" | "requests" | "latency">("reputation")

  const query = React.useMemo(
    () => ({
      capability: (capability || undefined) as AgentCapability | undefined,
      minReputation: minRep ? parseInt(minRep, 10) : undefined,
      maxPriceCSPR: maxPrice ? parseFloat(maxPrice) : undefined,
      activeOnly: true,
      sortBy,
      limit: 30,
    }),
    [capability, minRep, maxPrice, sortBy],
  )

  const { response, loading, error } = useMcpDiscovery(query)
  const { stats } = useMcpEconomyStats()

  return (
    <div className="mt-8 rounded-xl skywee-glass p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center">
            <Sparkles size={14} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">MCP Agent Discovery</h3>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Casper Model Context Protocol
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {response?.source === "live" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-foreground text-background">
              <Server size={9} /> Live MCP
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-foreground/10 text-muted-foreground">
              <Server size={9} /> Simulated
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Stat label="Total Agents" value={stats.totalAgents.toString()} />
          <Stat label="Active" value={stats.activeAgents.toString()} />
          <Stat label="Avg Rep" value={stats.avgReputation.toFixed(1)} />
          <Stat
            label="Volume"
            value={stats.totalVolumeCSPR >= 1_000_000
              ? `${(stats.totalVolumeCSPR / 1_000_000).toFixed(2)}M`
              : `${stats.totalVolumeCSPR.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            hint="CSPR"
          />
        </div>
      )}

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        AI agents use the Casper MCP server to discover SKYWEE agents matching
        a capability filter, then compose a paid request via x402. This is the
        discovery layer of the agent-to-agent economy.
      </p>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <Filter size={9} /> Capability
          </label>
          <select
            value={capability}
            onChange={(e) => setCapability(e.target.value as AgentCapability | "")}
            className="w-full px-2 py-1.5 text-xs bg-foreground/[0.02] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/40 cursor-pointer"
          >
            <option value="">All capabilities</option>
            {CAPABILITY_OPTIONS.map((cap) => (
              <option key={cap} value={cap}>{CAPABILITY_LABEL[cap]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Min Reputation
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={minRep}
            onChange={(e) => setMinRep(e.target.value)}
            placeholder="0"
            className="w-full px-2 py-1.5 text-xs bg-foreground/[0.02] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/40 placeholder:text-muted-foreground/40"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Max Price (CSPR)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="any"
            className="w-full px-2 py-1.5 text-xs bg-foreground/[0.02] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/40 placeholder:text-muted-foreground/40"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full px-2 py-1.5 text-xs bg-foreground/[0.02] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/40 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected capability description */}
      {capability && (
        <div className="mb-3 px-3 py-2 rounded-md bg-foreground/[0.03] border border-border/60 text-[11px] text-muted-foreground">
          <span className="font-mono text-foreground/80">{CAPABILITY_LABEL[capability]}:</span>{" "}
          {CAPABILITY_DESCRIPTION[capability]}
        </div>
      )}

      {/* Query latency indicator */}
      {response && (
        <div className="mb-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground/70">
          <span className="flex items-center gap-1.5">
            <Search size={9} />
            {loading
              ? "Querying MCP…"
              : `${response.total} agent${response.total === 1 ? "" : "s"} found`}
          </span>
          <span>took {response.tookMs}ms · {response.source}</span>
        </div>
      )}

      {/* Results */}
      {error && (
        <div className="p-3 rounded-md border border-foreground/30 bg-foreground/[0.05] text-xs text-foreground/80">
          {error}
        </div>
      )}
      {!error && !loading && response && response.agents.length === 0 && (
        <div className="p-8 text-center text-xs text-muted-foreground">
          No agents match these filters.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {!loading && response?.agents.map((agent, i) => (
          <AgentCard key={agent.id} agent={agent} index={i} />
        ))}
      </div>
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg skywee-hairline bg-foreground/[0.02] h-[180px] animate-pulse" />
          ))}
        </div>
      )}
    </div>
  )
}
