"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, ArrowUpRight } from "lucide-react"
import {
  TRANSACTIONS,
  MODULE_LABEL,
  type Transaction,
  type ModuleId,
} from "@/lib/skywee/data"

const STATUS_DOT: Record<Transaction["status"], string> = {
  confirmed: "bg-white",
  pending: "bg-white/40",
  failed: "bg-white/20",
}

const TYPE_LABEL: Record<string, string> = {
  "x402-payment": "x402 Payment",
  "consensus-execute": "Consensus Execute",
  "policy-issued": "Policy Issued",
  "dutch-auction-fill": "Dutch Auction Fill",
  "verification-pass": "Verification Pass",
  "credit-burn": "Credit Burn",
  "proposal-vote": "Proposal Vote",
  fractionalize: "Fractionalize",
}

function timeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

export function SkyweeActivityFeed() {
  // Use a stable initial render to avoid hydration mismatches.
  // Only update "time ago" text on the client after mount.
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    // Defer the initial tick so we don't setState synchronously in the effect body
    const initial = setTimeout(tick, 0)
    const id = setInterval(tick, 5000)
    return () => {
      clearTimeout(initial)
      clearInterval(id)
    }
  }, [])

  return (
    <section id="activity" className="relative py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            / 03 — Live Activity
          </div>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
            Every agent action,{" "}
            <span className="text-white/40">on-chain.</span>
          </h2>
          <p className="mt-5 text-base text-white/60 leading-relaxed">
            A real-time stream of transactions produced by SKYWEE agents on
            Casper Testnet. Every payment, vote, auction fill, policy
            issuance, and credit burn is anchored on-chain and verifiable
            through CSPR.cloud.
          </p>
        </div>

        {/* Feed */}
        <div className="mt-10 rounded-2xl skywee-glass overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-white/70" />
              <span className="text-xs font-mono uppercase tracking-wider text-white/50">
                Live Feed
              </span>
              <span className="ml-1 flex items-center gap-1.5">
                <span className="skywee-pulse-dot h-1.5 w-1.5 rounded-full bg-white" />
                <span className="text-[10px] font-mono text-white/60">streaming</span>
              </span>
            </div>
            <a
              href="#"
              className="text-[10px] font-mono text-white/50 hover:text-white inline-flex items-center gap-1"
            >
              CSPR.cloud explorer <ArrowUpRight size={10} />
            </a>
          </div>

          {/* Items */}
          <ul className="divide-y divide-white/[0.04]">
            <AnimatePresence initial={false}>
              {TRANSACTIONS.map((tx) => (
                <motion.li
                  key={tx.hash}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 hover:bg-white/[0.02] transition-colors grid grid-cols-12 gap-3 items-center"
                >
                  {/* Status dot */}
                  <div className="col-span-1 flex items-center">
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_DOT[tx.status],
                        tx.status === "confirmed" ? "skywee-pulse-dot" : "",
                      ].join(" ")}
                    />
                  </div>

                  {/* Module tag */}
                  <div className="col-span-3 sm:col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                      {MODULE_LABEL[tx.module as ModuleId]}
                    </span>
                  </div>

                  {/* Type */}
                  <div className="col-span-4 sm:col-span-3">
                    <span className="text-xs text-white">
                      {TYPE_LABEL[tx.type] ?? tx.type}
                    </span>
                  </div>

                  {/* Agent */}
                  <div className="hidden sm:block col-span-2">
                    <span className="text-xs font-mono text-white/60">{tx.agent}</span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 sm:col-span-2 text-right">
                    <span className="text-xs font-mono text-white skywee-tabular">
                      {tx.amountCSPR > 0 ? tx.amountCSPR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                      {tx.amountCSPR > 0 && <span className="text-white/40 ml-1">CSPR</span>}
                    </span>
                  </div>

                  {/* Block + time */}
                  <div className="col-span-2 text-right">
                    <div className="text-[10px] font-mono text-white/40">#{tx.block.toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-white/30">
                      {now ? timeAgo(tx.ts, now) : "—"}
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40">
              Showing last 8 transactions · Casper Testnet block #2,847,195
            </span>
            <button
              type="button"
              className="text-[10px] font-mono text-white/60 hover:text-white inline-flex items-center gap-1"
            >
              View all <ArrowUpRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
