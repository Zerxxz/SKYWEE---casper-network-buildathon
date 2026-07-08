"use client"

import { motion } from "framer-motion"
import { Boxes } from "lucide-react"

const STACK = [
  {
    name: "x402 Micropayments",
    desc: "HTTP-native payment protocol. Agents pay per API request with cryptographic proof — no off-chain settlement needed.",
    used: "All modules",
  },
  {
    name: "Casper MCP Server",
    desc: "Model Context Protocol server exposing blockchain state to AI agents — queries, signing, portfolio reads.",
    used: "AgentSquare · SwarmTreasury · CarbonGuard",
  },
  {
    name: "CSPR.trade MCP",
    desc: "DEX-access MCP for yield routing, swap quotes, and liquidity discovery across Casper-native AMMs.",
    used: "SwarmTreasury · RWA-X Vault",
  },
  {
    name: "CSPR.click Agent Skill",
    desc: "Installable coding skill enabling agents to create wallets, sign transactions, and access CSPR.cloud APIs.",
    used: "AgentSquare · SwarmTreasury",
  },
  {
    name: "CSPR.cloud APIs",
    desc: "Enterprise-grade REST, Streaming, and Node APIs for blockchain interaction at scale — used by every read path.",
    used: "All modules",
  },
  {
    name: "Odra Framework",
    desc: "Developer-friendly Rust smart contract framework with llms.txt support — agents autonomously generate and deploy contracts.",
    used: "All on-chain contracts",
  },
]

export function SkyweeStack() {
  return (
    <section id="stack" className="relative py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
            / 04 — Casper Stack
          </div>
          <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
            Built end-to-end on the{" "}
            <span className="text-white/40">Casper AI Toolkit.</span>
          </h2>
          <p className="mt-5 text-base text-white/60 leading-relaxed">
            SKYWEE is not a wrapper around a single Casper tool — it composes
            every component of the Casper AI Toolkit into a coherent product.
            Below is exactly which toolkit piece powers which module, so the
            Buildathon judges can trace each feature back to its on-chain
            primitive.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {STACK.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="rounded-xl skywee-glass p-5 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-white/5 border border-white/10 grid place-items-center">
                  <Boxes size={13} className="text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white">{s.name}</h3>
              </div>
              <p className="mt-3 text-xs text-white/60 leading-relaxed">{s.desc}</p>
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                  Used by
                </div>
                <div className="text-[11px] text-white/60 mt-0.5">{s.used}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
