"use client"

import { motion } from "framer-motion"
import { Github, ArrowUpRight, Calendar, Trophy, FileText, Video } from "lucide-react"
import { PageHeader } from "../page-header"

export function BuildathonPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Resources"
        title="One submission."
        titleAccent="Five products."
        description="SKYWEE is submitted to the Casper Innovation Track as a single unified prototype deployed on Casper Testnet. Every module produces transactions on-chain, every agent is registered in the Odra contract, every payment flows through x402. The repo is fully open-source with a documented README and demo video walkthrough."
        icon={Trophy}
      />

      {/* Submission card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl skywee-glass-strong p-6 sm:p-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full skywee-hairline bg-foreground/[0.04]">
          <Trophy size={11} className="text-foreground/70" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/70">
            Casper Agentic Buildathon 2026 · Qualification Round
          </span>
        </div>

        <h2 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight">
          Casper Innovation Track
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          SKYWEE competes in the unified track with five interlocking modules
          that together form a self-sustaining agent economy. The submission
          meets every eligibility criterion: working prototype on Casper
          Testnet, transaction-producing on-chain component, open-source
          repository, demo video, and original code developed for the
          Buildathon.
        </p>

        {/* Meta info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <Calendar size={10} /> Deadline
            </div>
            <div className="mt-1.5 text-sm font-semibold">June 30, 2026</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">23:59 UTC</div>
          </div>
          <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Prize Pool
            </div>
            <div className="mt-1.5 text-sm font-semibold">$150,000 USD</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">$30K cash + $120K in-kind</div>
          </div>
          <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Network
            </div>
            <div className="mt-1.5 text-sm font-semibold">Casper Testnet</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Odra smart contracts</div>
          </div>
        </div>

        {/* Submission checklist */}
        <div className="mt-6">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Submission Checklist
          </div>
          <div className="space-y-2">
            {[
              { label: "Working prototype on Casper Testnet", done: true },
              { label: "Transaction-producing on-chain component (Odra contracts)", done: true },
              { label: "Open-source GitHub repository with README", done: true },
              { label: "Demo video walkthrough", done: true },
              { label: "Original code developed for the Buildathon", done: true },
              { label: "Agentic AI integration via MCP & x402", done: true },
              { label: "DeFi + RWA use case", done: true },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 py-1.5 text-sm"
              >
                <div className="h-4 w-4 rounded-sm border border-foreground/40 bg-foreground grid place-items-center flex-shrink-0">
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-background" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-6" />
                  </svg>
                </div>
                <span className="text-foreground/80">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Github size={14} />
            View on GitHub
            <ArrowUpRight size={12} />
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 skywee-hairline bg-foreground/[0.03] rounded-md text-sm font-semibold hover:bg-foreground/[0.08] transition-colors"
          >
            <Video size={14} />
            Watch Demo Video
            <ArrowUpRight size={12} />
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 skywee-hairline bg-foreground/[0.03] rounded-md text-sm font-semibold hover:bg-foreground/[0.08] transition-colors"
          >
            <FileText size={14} />
            Read Whitepaper
            <ArrowUpRight size={12} />
          </a>
        </div>
      </motion.div>

      {/* Judging criteria */}
      <div className="mt-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-4">
          Final Round Judging Criteria
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Technical Execution", desc: "Code quality, architecture, implementation completeness" },
            { label: "Innovation & Originality", desc: "Novelty of approach, technology, and ideas" },
            { label: "Use of AI / Agentic Systems", desc: "Meaningful integration of AI agents and autonomous systems" },
            { label: "Real-World Applicability", desc: "Usefulness, especially in DeFi & RWA contexts" },
            { label: "User Experience & Design", desc: "Quality of interface and user interactions" },
            { label: "Working Smart Contracts", desc: "Functional, deployed contracts on Casper Testnet" },
            { label: "Long-Term Launch Plans", desc: "Real project with socials and deployment plans" },
            { label: "Long-Term Impact", desc: "Contribution to Casper ecosystem growth" },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5"
            >
              <div className="text-sm font-semibold">{c.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
