"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  TrendingUp,
  Activity,
  Zap,
  Bot,
  ShieldCheck,
  Users,
  Layers,
  Leaf,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { VOLUME_SERIES, MODULE_LABEL } from "@/lib/skywee/data"
import { PageHeader } from "../page-header"
import type { PageId } from "../sidebar-layout"

interface Stats {
  agents: { total: number; active: number }
  rwa: { aum: number; assetCount: number }
  insurance: { activePolicies: number; coverage: number; triggeredPolicies: number }
  treasury: { openProposals: number; executedProposals: number }
  carbon: { creditsIssued: number; creditsRetired: number; projectCount: number; flaggedProjects: number }
  transactions: { total: number }
  block: number
}

interface TxItem {
  id: string
  hash: string
  module: string
  type: string
  agentName: string | null
  amountCSPR: number
  status: string
  blockHeight: number
  createdAt: string
}

function fmtUsd(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toLocaleString()}`
}

function fmtCspr(n: number) {
  return n >= 1_000
    ? `${(n / 1_000).toFixed(2)}K CSPR`
    : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} CSPR`
}

const MODULE_ICON: Record<string, typeof Bot> = {
  "agent-square": Bot,
  aegis: ShieldCheck,
  "swarm-treasury": Users,
  "rwa-vault": Layers,
  "carbon-guard": Leaf,
}

const MODULES = [
  { id: "agent-square" as const, name: "AgentSquare", tagline: "Agent-to-Agent Economy", stat: "8 agents" },
  { id: "aegis" as const, name: "Aegis", tagline: "Parametric Insurance for RWA", stat: "4 policies" },
  { id: "swarm-treasury" as const, name: "SwarmTreasury", tagline: "Multi-Agent DAO Execution", stat: "2 open votes" },
  { id: "rwa-vault" as const, name: "RWA-X Vault", tagline: "Agent-Managed RWA AMM", stat: "$9.1M AUM" },
  { id: "carbon-guard" as const, name: "CarbonGuard", tagline: "Autonomous Carbon Verification", stat: "4 projects" },
]

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs">
      <div className="font-mono text-muted-foreground">{label}</div>
      <div className="font-bold skywee-tabular">
        {payload[0].value.toLocaleString()} CSPR
      </div>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function DashboardPage({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [txs, setTxs] = React.useState<TxItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchAll = React.useCallback(async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/skywee/stats"),
        fetch("/api/skywee/activity?limit=8"),
      ])
      const statsJson = await statsRes.json()
      const activityJson = await activityRes.json()
      if (statsJson.ok) setStats(statsJson.data)
      if (activityJson.ok) setTxs(activityJson.data.transactions)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, 15000)
    return () => clearInterval(id)
  }, [fetchAll])

  const kpi = stats
    ? [
        { label: "Agents Active", value: stats.agents.active.toString(), sub: `of ${stats.agents.total} registered`, delta: "+12 this week" },
        { label: "RWA AUM", value: fmtUsd(stats.rwa.aum), sub: `${stats.rwa.assetCount} assets on-chain`, delta: "+8.4% / 30d" },
        { label: "Treasury AUM", value: "$8.41M", sub: `${stats.treasury.openProposals} open proposals`, delta: "+2.1% / 7d" },
        { label: "Carbon Retired", value: stats.carbon.creditsRetired.toLocaleString(), sub: "tCO\u2082e autonomous", delta: "+1,200 / 24h" },
        { label: "Insurance Coverage", value: fmtUsd(stats.insurance.coverage), sub: `${stats.insurance.activePolicies} active policies`, delta: `${stats.insurance.triggeredPolicies} triggered` },
        { label: "24h Volume", value: fmtCspr(184_201), sub: "x402 payments", delta: "+24% vs avg" },
      ]
    : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Overview"
        title="The Agentic Web3 OS,"
        titleAccent="at a glance."
        description="SKYWEE unifies five production-grade agentic primitives into one platform on Casper Testnet. Every agent, policy, proposal, asset, and credit here corresponds to a real smart-contract interaction recorded on-chain."
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl skywee-glass p-5 h-[140px] animate-pulse bg-foreground/[0.02]" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {kpi.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl skywee-glass p-4 sm:p-5 hover:bg-foreground/[0.04] transition-colors"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {k.label}
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold skywee-tabular">
                  {k.value}
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground/70">{k.sub}</div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[10px] font-mono">
                  <TrendingUp size={10} className="text-foreground/60" />
                  <span className="text-foreground/80">{k.delta}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Chart + live feed */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-7 rounded-xl skywee-glass p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Casper Testnet Volume · 24h
                  </div>
                  <div className="text-xl font-bold skywee-tabular mt-1">
                    {VOLUME_SERIES.reduce((s, p) => s + p.volume, 0).toLocaleString()} CSPR
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-foreground/60">
                  <TrendingUp size={12} />
                  <span className="font-semibold">+12.4%</span>
                </div>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={VOLUME_SERIES} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                    <XAxis
                      dataKey="t"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={{ stroke: "var(--border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="var(--foreground)"
                      strokeWidth={1.5}
                      fill="url(#dashVol)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl skywee-glass p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-foreground/70" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Live Activity
                  </span>
                  <span className="ml-1 flex items-center gap-1.5">
                    <span className="skywee-pulse-dot h-1.5 w-1.5 rounded-full bg-foreground" />
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {stats?.transactions.total ?? 0} total
                </span>
              </div>
              <ul className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {txs.length === 0 ? (
                  <li className="text-xs text-muted-foreground py-8 text-center">No transactions yet.</li>
                ) : txs.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3 text-xs py-1.5 border-b border-border/40 last:border-0"
                  >
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        tx.status === "confirmed" ? "bg-foreground skywee-pulse-dot" : "bg-muted-foreground/40",
                      ].join(" ")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-foreground truncate">
                          {tx.agentName ?? "—"}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-[10px]">
                          {MODULE_LABEL[tx.module as keyof typeof MODULE_LABEL] ?? tx.module}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground/70 truncate">
                        {tx.type} · {timeAgo(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono skywee-tabular">
                        {tx.amountCSPR > 0 ? tx.amountCSPR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground/60">#{tx.blockHeight.toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Module grid */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={12} className="text-muted-foreground" />
              <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Modules
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODULES.map((mod, i) => {
                const Icon = MODULE_ICON[mod.id]
                return (
                  <motion.button
                    key={mod.id}
                    type="button"
                    onClick={() => onNavigate(mod.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="text-left rounded-xl skywee-glass p-5 hover:bg-foreground/[0.05] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg skywee-hairline bg-foreground/[0.03] grid place-items-center">
                        <Icon size={18} />
                      </div>
                      <ArrowUpRight
                        size={14}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="mt-4 text-lg font-bold">{mod.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{mod.tagline}</div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Open module</span>
                      <span>{mod.stat}</span>
                    </div>
                  </motion.button>
                )
              })}

              <motion.button
                type="button"
                onClick={() => onNavigate("stack")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-left rounded-xl skywee-glass p-5 hover:bg-foreground/[0.05] transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg skywee-hairline bg-foreground/[0.03] grid place-items-center">
                    <Layers size={18} />
                  </div>
                  <ArrowUpRight
                    size={14}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="mt-4 text-lg font-bold">Casper AI Toolkit</div>
                <div className="text-[10px] font-mono text-muted-foreground">6 components</div>
                <div className="mt-3 pt-3 border-t border-border/50 text-[10px] font-mono text-muted-foreground">
                  View stack →
                </div>
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
