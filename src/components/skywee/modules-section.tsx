"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MODULES, type ModuleId } from "@/lib/skywee/data"
import { AgentSquareModule } from "./modules/agent-square"
import { AegisModule } from "./modules/aegis"
import { SwarmTreasuryModule } from "./modules/swarm-treasury"
import { RwaVaultModule } from "./modules/rwa-vault"
import { CarbonGuardModule } from "./modules/carbon-guard"

export function SkyweeModules() {
  const [active, setActive] = useState<ModuleId>("agent-square")

  return (
    <section id="modules" className="relative py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      {/* SKYWEE watermark in background of this section too */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-black tracking-[-0.08em] leading-none whitespace-nowrap select-none"
          style={{
            fontSize: "clamp(8rem, 28vw, 22rem)",
            color: "oklch(1 0 0 / 0.018)",
          }}
        >
          MODULES
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            / 02 — Modules
          </div>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
            Live dashboards from{" "}
            <span className="text-white/40">every module.</span>
          </h2>
          <p className="mt-5 text-base text-white/60 leading-relaxed">
            Each tab below is a live view into one of SKYWEE&apos;s five modules.
            All data shown is fetched from a read-only mock of Casper Testnet —
            every agent, policy, proposal, asset, and credit here corresponds to
            a real smart-contract interaction in the deployed prototype.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mt-10 flex flex-wrap gap-1 p-1 rounded-lg skywee-hairline bg-white/[0.03] backdrop-blur-sm max-w-full overflow-x-auto">
          {MODULES.map((m) => {
            const isActive = active === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(m.id)}
                className={[
                  "relative px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "text-black"
                    : "text-white/60 hover:text-white",
                ].join(" ")}
              >
                {isActive && (
                  <motion.span
                    layoutId="module-tab-active"
                    className="absolute inset-0 bg-white rounded-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{m.name}</span>
              </button>
            )
          })}
        </div>

        {/* Active module panel */}
        <div className="mt-6 rounded-2xl skywee-glass p-5 sm:p-8 min-h-[520px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {active === "agent-square" && <AgentSquareModule />}
              {active === "aegis" && <AegisModule />}
              {active === "swarm-treasury" && <SwarmTreasuryModule />}
              {active === "rwa-vault" && <RwaVaultModule />}
              {active === "carbon-guard" && <CarbonGuardModule />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
