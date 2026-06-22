"use client"

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
import {
  PLATFORM_STATS,
  AGENTS,
  TRANSACTIONS,
  VOLUME_SERIES,
  MODULES,
  fmt,
  MODULE_LABEL,
  type ModuleId,
} from "@/lib/skywee/data"
import { PageHeader } from "../page-header"
import type { PageId } from "../sidebar-layout"

const MODULE_ICON: Record<ModuleId, typeof Bot> = {
  "agent-square": Bot,
  aegis: ShieldCheck,
  "swarm-treasury": Users,
  "rwa-vault": Layers,
  "carbon-guard": Leaf,
}

const KPI = [
  {
    label: "Agents Active",
    value: PLATFORM_STATS.agentsActive.toString(),
    sub: `of ${PLATFORM_STATS.agentsTotal} registered`,
    delta: "+12 this week",
  },
  {
    label: "RWA AUM",
    value: fmt.usd(PLATFORM_STATS.rwaAUM),
    sub: "tokenized on-chain",
    delta: "+8.4% / 30d",
  },
  {
    label: "Treasury AUM",
    value: fmt.usd(PLATFORM_STATS.treasuryAUM),
    sub: "agent-managed",
    delta: "+2.1% / 7d",
  },
  {
    label: "Carbon Retired",
    value: fmt.num(PLATFORM_STATS.carbonCreditsRetired),
    sub: "tCO\u2082e autonomous",
    delta: "+1,200 / 24h",
  },
  {
    label: "Insurance Coverage",
    value: fmt.usd(1_535_000),
    sub: "active policies",
    delta: `${PLATFORM_STATS.policiesActive} policies`,
  },
  {
    label: "24h Volume",
    value: fmt.cspr(184_201),
    sub: "x402 payments",
    delta: "+24% vs avg",
  },
]

const MODULE_CTA: Array<{ id: PageId; moduleId: ModuleId; stat: string }> = [
  { id: "agent-square", moduleId: "agent-square", stat: "8 agents" },
  { id: "aegis", moduleId: "aegis", stat: "4 policies" },
  { id: "swarm-treasury", moduleId: "swarm-treasury", stat: "2 open votes" },
  { id: "rwa-vault", moduleId: "rwa-vault", stat: "$9.1M AUM" },
  { id: "carbon-guard", moduleId: "carbon-guard", stat: "4 projects" },
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
        {fmt.num(payload[0].value)} CSPR
      </div>
    </div>
  )
}

export function DashboardPage({ onNavigate }: { onNavigate: (id: PageId) => void }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Overview"
        title="The Agentic Web3 OS,"
        titleAccent="at a glance."
        description="SKYWEE unifies five production-grade agentic primitives into one platform on Casper Testnet. Every agent, policy, proposal, asset, and credit here corresponds to a real smart-contract interaction."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {KPI.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl skywee-glass p-4 sm:p-5 hover:bg-foreground/[0.04] transition-colors"
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold skywee-tabular">
              {kpi.value}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground/70">{kpi.sub}</div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[10px] font-mono">
              <TrendingUp size={10} className="text-foreground/60" />
              <span className="text-foreground/80">{kpi.delta}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + live feed */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Volume chart */}
        <div className="lg:col-span-7 rounded-xl skywee-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Casper Testnet Volume · 24h
              </div>
              <div className="text-xl font-bold skywee-tabular mt-1">
                {fmt.num(VOLUME_SERIES.reduce((s, p) => s + p.volume, 0))} CSPR
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

        {/* Live transactions */}
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
          </div>
          <ul className="space-y-2.5 max-h-[220px] overflow-y-auto">
            {TRANSACTIONS.slice(0, 6).map((tx) => (
              <li
                key={tx.hash}
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
                    <span className="font-mono text-foreground truncate">{tx.agent}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground text-[10px]">{MODULE_LABEL[tx.module]}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground/70 truncate">{tx.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono skywee-tabular">
                    {tx.amountCSPR > 0 ? tx.amountCSPR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground/60">#{tx.block.toLocaleString()}</div>
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
            const cta = MODULE_CTA.find((m) => m.moduleId === mod.id)
            return (
              <motion.button
                key={mod.id}
                type="button"
                onClick={() => cta && onNavigate(cta.id)}
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
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {mod.description}
                </p>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {mod.casperTools.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-foreground/[0.04] border border-border rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{cta?.stat}</span>
                </div>
              </motion.button>
            )
          })}

          {/* Casper stack card */}
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
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              The full toolkit powering SKYWEE — x402, MCP servers, CSPR.click,
              CSPR.cloud, and Odra framework.
            </p>
            <div className="mt-3 pt-3 border-t border-border/50 text-[10px] font-mono text-muted-foreground">
              View stack →
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
