"use client"

import { motion } from "framer-motion"
import { Leaf, ArrowRight, Satellite, AlertTriangle } from "lucide-react"
import { CARBON_PROJECTS, fmt } from "@/lib/skywee/data"

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  verified: {
    label: "VERIFIED",
    cls: "bg-foreground text-background border-foreground",
  },
  pending: {
    label: "PENDING",
    cls: "bg-foreground/10 text-foreground border-foreground/20",
  },
  flagged: {
    label: "FLAGGED",
    cls: "bg-foreground/[0.03] text-foreground/40 border-foreground/10",
  },
}

export function CarbonGuardModule() {
  const totalIssued = CARBON_PROJECTS.reduce((s, p) => s + p.creditsIssued, 0)
  const totalRetired = CARBON_PROJECTS.reduce((s, p) => s + p.creditsRetired, 0)
  const flaggedCount = CARBON_PROJECTS.filter((p) => p.verification === "flagged").length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf size={18} className="text-foreground" />
            <h3 className="text-2xl font-bold text-foreground">CarbonGuard</h3>
          </div>
          <p className="mt-1 text-sm text-foreground/50">
            Autonomous Carbon Verification · satellite + IoT attested
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-foreground/40">Issued</div>
            <div className="text-sm font-bold text-foreground skywee-tabular">{fmt.num(totalIssued)} tCO₂e</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-foreground/40">Retired</div>
            <div className="text-sm font-bold text-foreground skywee-tabular">{fmt.num(totalRetired)} tCO₂e</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-foreground/40">Flagged</div>
            <div className="text-sm font-bold text-foreground skywee-tabular">{flaggedCount}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-foreground/60 leading-relaxed max-w-3xl">
        CarbonGuard tokenizes voluntary carbon credits as Casper-native RWA.
        The verification agent VER-Gaia continuously pulls satellite imagery
        and IoT sensor data through x402-paid data APIs. When projects fail
        verification — deforestation detected, sensor offline, biomass loss —
        the agent autonomously burns the corresponding credits on-chain,
        restoring trust in voluntary carbon markets.
      </p>

      {/* Burn alert */}
      {flaggedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-3 rounded-lg border border-foreground/30 bg-foreground/[0.06] p-3.5"
        >
          <AlertTriangle size={16} className="text-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-foreground">Burn initiated — </span>
            <span className="text-foreground/70">
              CRB-204 &quot;Borneo Peat Rewetting&quot; flagged by satellite analysis.
              17,600 credits queued for autonomous burn on next block.
            </span>
          </div>
        </motion.div>
      )}

      {/* Projects grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {CARBON_PROJECTS.map((p, i) => {
          const retiredPct = p.creditsIssued > 0 ? (p.creditsRetired / p.creditsIssued) * 100 : 0
          const badge = STATUS_BADGE[p.verification]
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4 hover:bg-foreground/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-foreground/5 border border-foreground/10 grid place-items-center flex-shrink-0">
                    <Satellite size={14} className="text-foreground/70" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-foreground/40">{p.id}</div>
                    <div className="text-sm font-semibold text-foreground">{p.name}</div>
                    <div className="text-[10px] text-foreground/40 mt-0.5">{p.location}</div>
                  </div>
                </div>
                <span
                  className={[
                    "flex-shrink-0 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border",
                    badge.cls,
                  ].join(" ")}
                >
                  {badge.label}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-foreground/40">
                <span className="px-1.5 py-0.5 rounded bg-foreground/5 border border-foreground/10">{p.type}</span>
              </div>

              {/* Retirement progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-foreground/40 mb-1.5">
                  <span>RETIRED</span>
                  <span className="text-foreground/70 skywee-tabular">
                    {fmt.num(p.creditsRetired)} / {fmt.num(p.creditsIssued)} tCO₂e
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: `${retiredPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-foreground/[0.06] flex items-center justify-between text-[10px] text-foreground/40">
                <span className="font-mono">last check</span>
                <span className="font-mono text-foreground/60">
                  {new Date(p.lastCheck).toLocaleTimeString("en-US", { hour12: false })}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Verification pipeline */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { step: "01", title: "Satellite pull", desc: "VER-Gaia fetches latest imagery via x402." },
          { step: "02", title: "Biomass delta", desc: "ML model computes NDVI delta vs baseline." },
          { step: "03", title: "On-chain attestation", desc: "Result posted as Casper contract event." },
          { step: "04", title: "Autonomous burn", desc: "If flagged, credits burned next block." },
        ].map((s) => (
          <div key={s.step} className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5">
            <div className="text-[10px] font-mono text-foreground/30">{s.step}</div>
            <div className="mt-1 text-sm font-semibold text-foreground">{s.title}</div>
            <div className="mt-1 text-xs text-foreground/50 leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Register a carbon project</div>
          <div className="text-xs text-foreground/50">Tokenize credits and start autonomous verification.</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-foreground text-background text-xs font-semibold rounded-md hover:bg-foreground/90 transition-colors"
        >
          Register Project
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}
