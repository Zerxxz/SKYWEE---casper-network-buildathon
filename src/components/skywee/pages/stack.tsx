"use client"

import { motion } from "framer-motion"
import { Boxes } from "lucide-react"
import { PageHeader } from "../page-header"

const STACK = [
  {
    name: "x402 Micropayments",
    desc: "HTTP-native payment protocol. Agents pay per API request with cryptographic proof — no off-chain settlement needed. Every x402 call produces a Casper transaction with payment attestation.",
    used: "All modules",
  },
  {
    name: "Casper MCP Server",
    desc: "Model Context Protocol server exposing blockchain state to AI agents — queries, signing, portfolio reads. The intelligence layer that lets agents reason about on-chain state.",
    used: "AgentSquare · SwarmTreasury · CarbonGuard",
  },
  {
    name: "CSPR.trade MCP",
    desc: "DEX-access MCP for yield routing, swap quotes, and liquidity discovery across Casper-native AMMs. Powers autonomous rebalancing and Dutch auction fills.",
    used: "SwarmTreasury · RWA-X Vault",
  },
  {
    name: "CSPR.click Agent Skill",
    desc: "Installable coding skill enabling agents to create wallets, sign transactions, and access CSPR.cloud APIs. The wallet layer for autonomous on-chain action.",
    used: "AgentSquare · SwarmTreasury",
  },
  {
    name: "CSPR.cloud APIs",
    desc: "Enterprise-grade REST API for blockchain interaction at scale — SKYWEE uses it for live block height, account balances, era info, peer count, and validator count. Cached 5s server-side to stay under free-tier rate limits.",
    used: "All modules · Live sidebar · Dashboard network widget",
  },
  {
    name: "Odra Framework",
    desc: "Developer-friendly Rust smart contract framework with llms.txt support — agents autonomously generate and deploy contracts. Every SKYWEE contract is written in Odra.",
    used: "All on-chain contracts",
  },
]

export function StackPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Resources"
        title="Built end-to-end on the"
        titleAccent="Casper AI Toolkit."
        description="SKYWEE is not a wrapper around a single Casper tool — it composes every component of the Casper AI Toolkit into a coherent product. Below is exactly which toolkit piece powers which module, so the Buildathon judges can trace each feature back to its on-chain primitive."
        icon={Boxes}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STACK.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="rounded-xl skywee-glass p-5 hover:bg-foreground/[0.04] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center">
                <Boxes size={13} />
              </div>
              <h3 className="text-sm font-semibold">{s.name}</h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                Used by
              </div>
              <div className="text-[11px] text-foreground/70 mt-0.5">{s.used}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Casper Manifest reference */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 rounded-xl skywee-glass-strong p-6 sm:p-8"
      >
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Casper Manifest
        </div>
        <h3 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">
          Casper as the trust layer for the agent economy.
        </h3>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">
          SKYWEE is a direct implementation of the Casper Manifesto vision: a
          blockchain purpose-built to serve as the trust layer for autonomous
          agent commerce. Every payment, reputation update, governance vote,
          and asset tokenization in SKYWEE is anchored on Casper —
          verifiable, immutable, and trustless.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Native</div>
            <div className="mt-1 text-sm font-semibold">Account model</div>
          </div>
          <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Upgradeable</div>
            <div className="mt-1 text-sm font-semibold">Smart contracts</div>
          </div>
          <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Energy-efficient</div>
            <div className="mt-1 text-sm font-semibold">PoS consensus</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
