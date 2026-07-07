"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Zap, ArrowRight, Github } from "lucide-react"

interface LandingPageProps {
  onEnter: () => void
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background effects */}
      <div className="skywee-global-watermark" aria-hidden="true">
        <div className="skywee-watermark-parallax" style={{ position: "relative", height: "100%" }}>
          <span
            className="skywee-global-watermark-center"
            style={{
              opacity: 1,
              top: "70%",
              transform: "translate(-50%, -50%)",
              position: "absolute",
              letterSpacing: "0.04em",
            }}
          >
            SKYWEE
          </span>
        </div>
      </div>
      <div className="skywee-grain" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="absolute inset-0 skywee-grid opacity-30"
        style={{
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 40%, black 0%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 40%, black 0%, transparent 80%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div
            className="h-10 w-10 rounded-lg bg-white overflow-hidden shadow-sm flex-shrink-0"
            style={{
              backgroundImage: "url(/skywee-logo-icon.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <span className="font-mono text-sm font-bold tracking-[0.18em]">SKYWEE</span>
        </div>
        <a
          href="https://github.com/Zerxxz/SKYWEE---casper-network-buildathon"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] transition-colors text-xs font-mono"
        >
          <Github size={12} />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </header>

      {/* Main hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-5xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full skywee-hairline bg-foreground/[0.03] mb-8"
        >
          <Zap size={11} className="text-muted-foreground" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Casper Agentic Buildathon 2026
          </span>
        </motion.div>

        {/* Logo besar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="flex flex-col items-center mb-6"
        >
          <div className="skywee-glass-shine-wrapper h-24 w-24 rounded-2xl mb-6">
            <div
              className="h-full w-full rounded-2xl bg-white overflow-hidden shadow-lg"
              style={{
                backgroundImage: "url(/skywee-logo-icon.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div className="skywee-glass-shine" aria-hidden="true" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="skywee-glass-shine-text text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.9] text-center relative"
        >
          <span className="relative z-10">SKYWEE</span>
          <span className="skywee-glass-shine-text-overlay" aria-hidden="true" />
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
          className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-center"
        >
          The Agentic Web3 Operating System on Casper Network. Five modules — agent
          economy, insurance, treasury, RWA vaults, and carbon verification — unified
          in one autonomous platform.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <div className="inline-block">
            <div className="relative">
              <div className="skywee-aura-ring" aria-hidden="true" />
              <div className="skywee-aura-glow" aria-hidden="true" />
              <button
                type="button"
                onClick={onEnter}
                className="group relative inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-base font-bold hover:opacity-90 transition-all disabled:opacity-70 z-10"
              >
                <span>Get Started</span>
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/60 font-mono">
            Connect your Casper Wallet to enter
          </p>
        </motion.div>

        {/* Module ticker / marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 w-full max-w-3xl"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50">
            <span>AgentSquare</span>
            <span className="text-muted-foreground/30">·</span>
            <span>Aegis</span>
            <span className="text-muted-foreground/30">·</span>
            <span>SwarmTreasury</span>
            <span className="text-muted-foreground/30">·</span>
            <span>RWA-X Vault</span>
            <span className="text-muted-foreground/30">·</span>
            <span>CarbonGuard</span>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-5 flex items-center justify-between text-[10px] font-mono text-muted-foreground/40">
        <span>© 2026 SKYWEE</span>
        <span>Casper Testnet · Protocol 2.2.2</span>
      </footer>
    </div>
  )
}
