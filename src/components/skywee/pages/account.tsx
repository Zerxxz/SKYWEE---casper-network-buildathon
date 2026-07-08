"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  UserCircle,
  Wallet,
  Bot,
  Activity,
  ShieldCheck,
  Users,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
} from "lucide-react"
import { PageHeader } from "../page-header"
import { ScrollReveal } from "../scroll-reveal"
import { Skeleton, SkeletonCard } from "../skeleton"
import { useWallet } from "@/lib/skywee/wallet"
import { useToast } from "@/hooks/use-toast"

interface AccountData {
  address: string
  shortAddress: string
  explorerUrl: string
  balance: number | null
  hasRealBalance: boolean
  agents: {
    total: number
    active: number
    avgReputation: number
    list: Array<{
      id: string
      onChainId: number
      name: string
      role: string
      reputation: number
      requestsFulfilled: number
      pricePerRequest: number
      active: boolean
    }>
  }
  transactions: {
    total: number
    list: Array<{
      id: string
      hash: string
      module: string
      type: string
      agentName: string | null
      amountCSPR: number
      status: string
      blockHeight: number
      createdAt: string
    }>
  }
  policies: {
    total: number
    list: Array<{
      id: string
      onChainId: number
      rwaName: string
      trigger: string
      coverage: number
      status: string
    }>
  }
  proposals: {
    total: number
    list: Array<{
      id: string
      onChainId: number
      title: string
      amountCSPR: number
      status: string
    }>
  }
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
    : `${n.toLocaleString()} CSPR`
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

const MODULE_LABEL: Record<string, string> = {
  "agent-square": "AgentSquare",
  aegis: "Aegis",
  "swarm-treasury": "SwarmTreasury",
  "rwa-vault": "RWA-X Vault",
  "carbon-guard": "CarbonGuard",
}

const ROLE_LABEL: Record<string, string> = {
  "risk-scorer": "Risk Scorer",
  "yield-router": "Yield Router",
  compliance: "Compliance",
  executor: "Executor",
  oracle: "Oracle",
  "market-maker": "Market Maker",
  verifier: "Verifier",
  treasurer: "Treasurer",
}

export function AccountPage() {
  const { publicKey, isDemo, shortAddress } = useWallet()
  const { toast } = useToast()
  const [data, setData] = React.useState<AccountData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    if (!publicKey) return
    try {
      const res = await fetch(`/api/skywee/account/${encodeURIComponent(publicKey)}`)
      const json = await res.json()
      if (json.ok) setData(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [publicKey])

  React.useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15000)
    return () => clearInterval(id)
  }, [fetchData])

  const copyAddress = async () => {
    if (!publicKey) return
    try {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Your Account"
          title="Account"
          titleAccent="& activity"
          description="Your wallet, agents, transactions, and on-chain activity on Casper Testnet."
          icon={UserCircle}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <PageHeader
          eyebrow="Your Account"
          title="Account"
          titleAccent="& activity"
          description="Your wallet, agents, transactions, and on-chain activity on Casper Testnet."
          icon={UserCircle}
        />
        <div className="p-8 text-center text-sm text-muted-foreground">
          Failed to load account data.
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Balance", value: data.balance !== null ? fmtCspr(data.balance) : "—", icon: Wallet, sub: data.hasRealBalance ? "Live" : "Demo" },
    { label: "Agents", value: data.agents.total.toString(), icon: Bot, sub: `${data.agents.active} active` },
    { label: "Transactions", value: data.transactions.total.toString(), icon: Activity, sub: "all time" },
    { label: "Policies", value: data.policies.total.toString(), icon: ShieldCheck, sub: `${data.proposals.total} proposals` },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Your Account"
        title="Account"
        titleAccent="& activity"
        description="Your wallet, agents, transactions, and on-chain activity on Casper Testnet."
        icon={UserCircle}
      />

      {/* Wallet card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl skywee-glass-strong p-5 mb-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold text-lg flex-shrink-0">
              {shortAddress?.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {isDemo ? "Demo Wallet" : "Casper Wallet"}
                </span>
                {isDemo ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground/10 text-muted-foreground">
                    <Zap size={8} /> Demo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-primary text-primary-foreground">
                    Live
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-sm skywee-tabular break-all">{shortAddress}</span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="p-1 rounded hover:bg-foreground/5 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check size={12} className="text-foreground" />
                  ) : (
                    <Copy size={12} className="text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                Casper Testnet · {data.balance !== null ? fmtCspr(data.balance) : "—"}
              </div>
            </div>
          </div>
          <a
            href={data.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] transition-colors text-[10px] font-mono uppercase tracking-wider"
          >
            <ExternalLink size={10} />
            View on cspr.live
          </a>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl skywee-glass p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <Icon size={11} />
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-bold skywee-tabular">{s.value}</div>
              <div className="mt-1 text-[10px] text-muted-foreground/70">{s.sub}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Agents + Transactions grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User's Agents */}
        <ScrollReveal direction="up">
          <div className="rounded-xl skywee-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Your Agents
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {data.agents.total} agent{data.agents.total === 1 ? "" : "s"}
              </span>
            </div>
            {data.agents.list.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No agents deployed yet. Visit AgentSquare to deploy one.
              </div>
            ) : (
              <ul className="space-y-2 max-h-[300px] overflow-y-auto">
                {data.agents.list.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex items-center gap-3 p-2.5 rounded-md hover:bg-foreground/[0.03] transition-colors"
                  >
                    <div className="h-8 w-8 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center flex-shrink-0">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono truncate">{agent.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          AGT-{String(agent.onChainId).padStart(3, "0")}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {ROLE_LABEL[agent.role] ?? agent.role} · rep {agent.reputation}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-mono skywee-tabular">
                        {agent.pricePerRequest === 0 ? "Free" : `${agent.pricePerRequest} CSPR`}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {agent.requestsFulfilled.toLocaleString()} reqs
                      </div>
                    </div>
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        agent.active ? "bg-foreground skywee-pulse-dot" : "bg-muted-foreground/40",
                      ].join(" ")}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollReveal>

        {/* Recent Transactions */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="rounded-xl skywee-glass p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Recent Activity
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {data.transactions.total} total
              </span>
            </div>
            {data.transactions.list.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No transactions yet. Deploy an agent or issue a policy to get started.
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {data.transactions.list.slice(0, 15).map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0"
                  >
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                        tx.status === "confirmed" ? "bg-foreground" : "bg-muted-foreground/40",
                      ].join(" ")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono truncate">
                          {tx.agentName ?? tx.type}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {MODULE_LABEL[tx.module] ?? tx.module}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/70">
                        {tx.type} · {timeAgo(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-mono skywee-tabular">
                        {tx.amountCSPR > 0 ? tx.amountCSPR.toLocaleString() : "—"}
                      </div>
                      <div className="text-[9px] font-mono text-muted-foreground/60">
                        #{tx.blockHeight.toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Policies + Proposals */}
      {(data.policies.list.length > 0 || data.proposals.list.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {data.policies.list.length > 0 && (
            <ScrollReveal direction="up">
              <div className="rounded-xl skywee-glass p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={14} className="text-muted-foreground" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Your Policies
                  </h3>
                </div>
                <ul className="space-y-2">
                  {data.policies.list.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-foreground/[0.03] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate">{p.rwaName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          POL-{p.onChainId} · {p.trigger}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-xs font-mono skywee-tabular">{fmtUsd(p.coverage)}</div>
                        <div className="text-[9px] text-muted-foreground uppercase">{p.status}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          )}
          {data.proposals.list.length > 0 && (
            <ScrollReveal direction="up" delay={0.1}>
              <div className="rounded-xl skywee-glass p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={14} className="text-muted-foreground" />
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Your Proposals
                  </h3>
                </div>
                <ul className="space-y-2">
                  {data.proposals.list.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-foreground/[0.03] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm truncate">{p.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          PROP-{p.onChainId} · {fmtCspr(p.amountCSPR)}
                        </div>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-muted-foreground flex-shrink-0 ml-3">
                        {p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          )}
        </div>
      )}
    </div>
  )
}
