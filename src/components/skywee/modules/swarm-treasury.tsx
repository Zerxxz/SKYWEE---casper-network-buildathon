"use client"

import { motion } from "framer-motion"
import { Users, ArrowRight, MessageSquare } from "lucide-react"
import { TREASURY_PROPOSALS, ROLE_LABEL, fmt, type TreasuryProposal } from "@/lib/skywee/data"

const STATUS_BADGE: Record<TreasuryProposal["status"], string> = {
  voting: "bg-white/10 text-white border-white/20",
  executed: "bg-white text-black border-white",
  rejected: "bg-white/[0.03] text-white/30 border-white/5 line-through",
}

const DELIBERATION_LOG: Array<{ agent: string; role: string; msg: string; t: string }> = [
  {
    agent: "YLR-3",
    role: "Yield Router",
    msg: "Detected 4.2% yield improvement on CSPR.trade CSPR/csprUSD pool. Proposing 40% rebalance.",
    t: "T-00:12",
  },
  {
    agent: "RYSK-7",
    role: "Risk Scorer",
    msg: "Risk score 0.71 — within tolerance. IL exposure acceptable at current volatility band.",
    t: "T-00:09",
  },
  {
    agent: "CMP-Vera",
    role: "Compliance",
    msg: "No sanctions hits. Pool contract audited. Approved for execution.",
    t: "T-00:07",
  },
  {
    agent: "TRS-Odin",
    role: "Treasurer",
    msg: "Consensus reached (3/3). Opening governance vote — amount exceeds auto-execute threshold.",
    t: "T-00:05",
  },
  {
    agent: "EXE-Max",
    role: "Executor",
    msg: "Standing by for governance outcome. Will sign if quorum met within 48h.",
    t: "T-00:02",
  },
]

export function SwarmTreasuryModule() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-white" />
            <h3 className="text-2xl font-bold text-white">SwarmTreasury</h3>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Multi-Agent DAO Execution · 4-agent consensus swarm
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Treasury</div>
            <div className="text-sm font-bold text-white skywee-tabular">{fmt.usd(8_412_000)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Open votes</div>
            <div className="text-sm font-bold text-white skywee-tabular">
              {TREASURY_PROPOSALS.filter((p) => p.status === "voting").length}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Agents</div>
            <div className="text-sm font-bold text-white skywee-tabular">4</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-3xl">
        Four specialized agents — Yield Router, Risk Scorer, Compliance, and
        Treasurer — deliberate on every treasury action. Small actions
        auto-execute via 2-of-3 consensus; large actions become governance
        proposals. The full deliberation trail is written on-chain as an
        immutable audit log.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deliberation log */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-white/60" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-white/50">
              Live Deliberation · PROP-441
            </h4>
          </div>
          <div className="rounded-lg skywee-hairline bg-black/30 p-3 max-h-[420px] overflow-y-auto">
            <div className="space-y-3">
              {DELIBERATION_LOG.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-7 w-7 rounded-md bg-white/5 border border-white/10 grid place-items-center">
                      <span className="text-[10px] font-mono text-white/70">
                        {entry.agent.slice(0, 2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-white">{entry.agent}</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/60">{entry.role}</span>
                      <span className="ml-auto font-mono text-[10px] text-white/30">{entry.t}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/70 leading-relaxed">
                      {entry.msg}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Proposals list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-white/60" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-white/50">
              Treasury Proposals
            </h4>
          </div>
          <div className="space-y-2.5">
            {TREASURY_PROPOSALS.map((p, i) => {
              const total = p.votesFor + p.votesAgainst
              const forPct = total > 0 ? (p.votesFor / total) * 100 : 0
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg skywee-hairline bg-white/[0.02] p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-white/40">{p.id}</div>
                      <div className="text-sm text-white font-medium leading-snug">{p.title}</div>
                    </div>
                    <span
                      className={[
                        "flex-shrink-0 px-2 py-0.5 text-[10px] font-mono uppercase rounded border",
                        STATUS_BADGE[p.status],
                      ].join(" ")}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-white/40">
                    <span>by <span className="text-white/60 font-mono">{ROLE_LABEL[p.proposedBy]}</span></span>
                    <span>·</span>
                    <span>{p.deliberationRounds} rounds</span>
                    <span>·</span>
                    <span className="font-mono skywee-tabular">{fmt.cspr(p.amountCSPR)}</span>
                  </div>

                  {p.status === "voting" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 mb-1">
                        <span className="text-white/70">FOR {fmt.num(p.votesFor)}</span>
                        <span className="text-white/40">{forPct.toFixed(1)}%</span>
                        <span className="text-white/40">AGAINST {fmt.num(p.votesAgainst)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full"
                          style={{ width: `${forPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-white/[0.02] p-4">
        <div>
          <div className="text-sm text-white font-semibold">Open new proposal</div>
          <div className="text-xs text-white/50">Submit an action to the agent swarm for deliberation.</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-semibold rounded-md hover:bg-white/90 transition-colors"
        >
          New Proposal
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}
