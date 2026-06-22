"use client"

import { motion } from "framer-motion"
import {
  Bot,
  ShieldCheck,
  Users,
  Layers,
  Leaf,
} from "lucide-react"
import { MODULES, type ModuleId } from "@/lib/skywee/data"

const ICON: Record<ModuleId, typeof Bot> = {
  "agent-square": Bot,
  aegis: ShieldCheck,
  "swarm-treasury": Users,
  "rwa-vault": Layers,
  "carbon-guard": Leaf,
}

export function SkyweeArchitecture() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            / 01 — Architecture
          </div>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
            Five modules.{" "}
            <span className="text-white/40">One trust layer.</span>
          </h2>
          <p className="mt-5 text-base text-white/60 leading-relaxed">
            SKYWEE unifies five production-grade agentic primitives into a single
            platform deployed on Casper Testnet. Each module is independently
            useful — together, they form a self-sustaining agent economy where
            insurance, treasury, asset tokenization, and carbon verification all
            feed each other through on-chain x402 payments and MCP-mediated
            intelligence.
          </p>
        </div>

        {/* Central architecture diagram */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Center hub */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 lg:row-span-2 relative rounded-2xl skywee-glass-strong p-8 flex flex-col justify-between min-h-[320px]"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                / core
              </div>
              <div className="mt-3 text-4xl font-black tracking-tighter text-white">
                SKYWEE
              </div>
              <div className="mt-2 text-sm text-white/50">
                Agentic Web3 OS
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              {[
                "x402 payment routing",
                "Casper MCP orchestration",
                "On-chain agent registry",
                "Reputation attestation",
              ].map((line) => (
                <div
                  key={line}
                  className="flex items-center gap-2 text-xs text-white/70"
                >
                  <span className="h-1 w-1 rounded-full bg-white/60" />
                  <span className="font-mono">{line}</span>
                </div>
              ))}
            </div>

            {/* Connector dots */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-1/2 -right-3 h-px w-6 bg-white/20 hidden lg:block" />
              <div className="absolute top-1/2 -left-3 h-px w-6 bg-white/20 hidden lg:block" />
            </div>
          </motion.div>

          {/* Module cards */}
          {MODULES.map((mod, i) => {
            const Icon = ICON[mod.id]
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="lg:col-span-4 rounded-2xl skywee-glass p-6 hover:bg-white/[0.07] transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 grid place-items-center">
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                    0{i + 1}
                  </span>
                </div>
                <div className="mt-4 text-xl font-bold text-white">
                  {mod.name}
                </div>
                <div className="text-xs text-white/40 font-mono">
                  {mod.tagline}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/60">
                  {mod.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {mod.casperTools.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[10px] font-mono text-white/60 bg-white/5 border border-white/10 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
