"use client"

import { motion } from "framer-motion"
import { ShieldCheck, AlertTriangle, ArrowRight, Activity } from "lucide-react"
import { INSURANCE_POLICIES, fmt } from "@/lib/skywee/data"

const STATUS_BADGE: Record<string, string> = {
  active: "bg-white/10 text-white/70 border-white/15",
  triggered: "bg-white text-black border-white",
  expired: "bg-white/[0.03] text-white/30 border-white/5",
}

export function AegisModule() {
  const totalCoverage = INSURANCE_POLICIES.reduce((s, p) => s + p.coverage, 0)
  const totalPremium = INSURANCE_POLICIES.reduce((s, p) => s + p.premium, 0)
  const triggeredCount = INSURANCE_POLICIES.filter((p) => p.status === "triggered").length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-white" />
            <h3 className="text-2xl font-bold text-white">Aegis</h3>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Parametric Insurance for RWA · autonomous payout contracts
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Coverage</div>
            <div className="text-sm font-bold text-white skywee-tabular">{fmt.usd(totalCoverage)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Premiums</div>
            <div className="text-sm font-bold text-white skywee-tabular">{fmt.usd(totalPremium)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Triggered</div>
            <div className="text-sm font-bold text-white skywee-tabular">{triggeredCount}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-3xl">
        Aegis wraps every tokenized RWA in a parametric insurance contract.
        The monitoring agent (ORC-12) continuously pulls off-chain data — GPS,
        weather, flight, IoT sensors — through x402-paid data APIs. When a
        trigger condition is met, the agent calls the payout contract directly.
        Settlement happens in seconds, fully on-chain, with no claims
        adjuster in the loop.
      </p>

      {/* Alert banner */}
      {triggeredCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-3 rounded-lg border border-white/30 bg-white/[0.06] p-3.5"
        >
          <AlertTriangle size={16} className="text-white mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-white">Trigger active — </span>
            <span className="text-white/70">
              POL-7822 &quot;Soybean Field — Kalimantan&quot; rainfall below threshold.
              Payout of {fmt.usd(80_000)} scheduled for next block.
            </span>
          </div>
        </motion.div>
      )}

      {/* Policies grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {INSURANCE_POLICIES.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg skywee-hairline bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono text-white/40">{p.id}</div>
                <div className="mt-0.5 text-sm font-semibold text-white">{p.rwa}</div>
              </div>
              <span
                className={[
                  "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border",
                  STATUS_BADGE[p.status],
                ].join(" ")}
              >
                {p.status}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-white/40">
              <Activity size={10} /> TRIGGER
            </div>
            <div className="mt-1 text-xs text-white/70 font-mono">{p.trigger}</div>

            <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-white/[0.06]">
              <div>
                <div className="text-[10px] uppercase text-white/40">Coverage</div>
                <div className="text-sm font-bold text-white skywee-tabular">{fmt.usd(p.coverage)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/40">Premium</div>
                <div className="text-sm font-bold text-white skywee-tabular">{fmt.usd(p.premium)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-white/40">Agent</div>
                <div className="text-sm font-mono text-white/70">{p.monitoringAgent}</div>
              </div>
            </div>

            {p.payoutEligible && (
              <div className="mt-3 px-3 py-2 rounded bg-white text-black text-xs font-semibold flex items-center justify-between">
                <span>Payout eligible — auto-settling</span>
                <ArrowRight size={12} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-white/[0.02] p-4">
        <div>
          <div className="text-sm text-white font-semibold">Issue new policy</div>
          <div className="text-xs text-white/50">Wrap a tokenized RWA in parametric insurance.</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-semibold rounded-md hover:bg-white/90 transition-colors"
        >
          Issue Policy
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}
