"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { PLATFORM_STATS, fmt } from "@/lib/skywee/data"

const HERO_STATS = [
  { label: "Agents Active", value: PLATFORM_STATS.agentsActive.toString(), sub: `of ${PLATFORM_STATS.agentsTotal}` },
  { label: "RWA AUM", value: fmt.usd(PLATFORM_STATS.rwaAUM), sub: "on-chain" },
  { label: "Treasury AUM", value: fmt.usd(PLATFORM_STATS.treasuryAUM), sub: "agent-managed" },
  { label: "Carbon Retired", value: fmt.num(PLATFORM_STATS.carbonCreditsRetired), sub: "tCO\u2082e" },
]

export function SkyweeHero() {
  return (
    <section
      id="overview"
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Giant SKYWEE watermark in the background */}
      <div className="skywee-watermark" aria-hidden>
        <span className="skywee-watermark-text">SKYWEE</span>
      </div>

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 skywee-grid opacity-50"
        style={{
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 0%, transparent 80%)",
        }}
      />

      {/* Radial vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, oklch(0.05 0 0) 85%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full skywee-hairline bg-white/5 backdrop-blur-sm"
          >
            <Sparkles size={11} className="text-white/70" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
              Casper Agentic Buildathon 2026
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-8 text-5xl sm:text-7xl lg:text-9xl font-black tracking-[-0.04em] leading-[0.9] text-white"
          >
            SKYWEE
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="mt-6 max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed"
          >
            The Agentic Web3 Operating System on Casper Network.
            <br className="hidden sm:block" />
            One unified layer where AI agents trade, insure, govern,
            fractionalize, and verify real-world assets — autonomously.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
            className="mt-9 flex flex-col sm:flex-row gap-3"
          >
            <a
              href="#modules"
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black rounded-md text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Explore Modules
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#activity"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 skywee-hairline bg-white/5 text-white rounded-md text-sm font-semibold hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              View Live Activity
            </a>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.26 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px skywee-hairline rounded-lg overflow-hidden w-full max-w-4xl bg-white/[0.03] backdrop-blur-sm"
          >
            {HERO_STATS.map((s) => (
              <div
                key={s.label}
                className="px-4 py-5 sm:px-6 sm:py-6 bg-black/40 text-center"
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                  {s.label}
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold text-white skywee-tabular">
                  {s.value}
                </div>
                <div className="mt-1 text-[10px] text-white/40">{s.sub}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="flex flex-col items-center gap-2 text-white/30">
          <span className="text-[10px] font-mono uppercase tracking-wider">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </motion.div>
    </section>
  )
}
