"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  Zap,
  ArrowRight,
  Github,
  Bot,
  ShieldCheck,
  Users,
  Layers,
  Leaf,
  Wallet,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useWallet } from "@/lib/skywee/wallet"

interface LandingPageProps {
  onEnter: () => void
}

const MODULES = [
  {
    icon: Bot,
    name: "AgentSquare",
    desc: "Agent-to-agent economy with x402 payments",
  },
  {
    icon: ShieldCheck,
    name: "Aegis",
    desc: "Parametric insurance for RWA",
  },
  {
    icon: Users,
    name: "SwarmTreasury",
    desc: "Multi-agent DAO execution",
  },
  {
    icon: Layers,
    name: "RWA-X Vault",
    desc: "Agent-managed RWA fractionalization",
  },
  {
    icon: Leaf,
    name: "CarbonGuard",
    desc: "Autonomous carbon verification",
  },
] as const

export function LandingPage({ onEnter }: LandingPageProps) {
  const { connect, status, isExtensionInstalled, error, enterDemoMode } = useWallet()
  const [connecting, setConnecting] = React.useState(false)

  // Handle "Connect Casper Wallet" click — triggers extension popup.
  // On success, the wallet's `connected` event fires (handled in wallet.tsx),
  // which sets status to "connected". We then call onEnter() to enter dashboard.
  // On rejection/cancel, status returns to "disconnected" — user stays on landing.
  const handleConnect = React.useCallback(async () => {
    setConnecting(true)
    try {
      await connect()
      // If connect succeeded (extension returned a public key), enter dashboard.
      // We use a microtask delay so the wallet state propagates.
      // The connect() function already sets status to "connected" on success.
      // If it fell back to demo (no extension), still enter dashboard.
      setTimeout(() => {
        onEnter()
      }, 200)
    } catch (e) {
      console.error("Wallet connect failed:", e)
    } finally {
      setConnecting(false)
    }
  }, [connect, onEnter])

  // Handle "Try Demo Mode" — explicitly enters demo mode, then enters dashboard.
  // This bypasses the Casper Wallet extension entirely.
  const handleDemo = React.useCallback(() => {
    enterDemoMode()
    onEnter()
  }, [enterDemoMode, onEnter])

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

        {/* CTAs — Connect Casper Wallet (primary) + Try Demo Mode (secondary) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          {/* Primary: Connect Casper Wallet */}
          <div className="inline-block">
            <div className="relative">
              <div className="skywee-aura-ring" aria-hidden="true" />
              <div className="skywee-aura-glow" aria-hidden="true" />
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting || status === "connecting"}
                className="group relative inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-base font-bold hover:opacity-90 transition-all disabled:opacity-70 z-10"
              >
                {connecting || status === "connecting" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Connecting…</span>
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    <span>Connect Casper Wallet</span>
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extension not installed warning */}
          {!isExtensionInstalled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-[11px] text-muted-foreground max-w-md text-center"
            >
              <AlertCircle size={11} className="flex-shrink-0" />
              <span>
                Casper Wallet extension not detected.{" "}
                <a
                  href="https://www.casperwallet.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Install it here
                </a>{" "}
                for real on-chain deploys, or try demo mode below.
              </span>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-[11px] text-red-500 font-mono">{error}</div>
          )}

          {/* Secondary: Try Demo Mode */}
          <button
            type="button"
            onClick={handleDemo}
            className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors font-mono"
          >
            or try demo mode →
          </button>
        </motion.div>

        {/* Marquee ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 w-full max-w-3xl overflow-hidden relative"
          aria-hidden="true"
        >
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <div className="skywee-landing-marquee">
            <span className="text-sm font-mono text-muted-foreground/50 whitespace-nowrap">
              The Agentic Web3 OS, at a glance&nbsp;&nbsp;·&nbsp;&nbsp;
              The Agentic Web3 OS, at a glance&nbsp;&nbsp;·&nbsp;&nbsp;
              The Agentic Web3 OS, at a glance&nbsp;&nbsp;·&nbsp;&nbsp;
              The Agentic Web3 OS, at a glance&nbsp;&nbsp;·&nbsp;&nbsp;
              The Agentic Web3 OS, at a glance&nbsp;&nbsp;·&nbsp;&nbsp;
              The Agentic Web3 OS, at a glance&nbsp;&nbsp;·&nbsp;&nbsp;
            </span>
          </div>
        </motion.div>

        {/* 5 Module cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full max-w-4xl"
        >
          {MODULES.map((m, i) => {
            const Icon = m.icon
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.08 }}
                className="rounded-xl skywee-glass p-4 hover:bg-foreground/[0.05] transition-colors group cursor-default"
              >
                <div className="h-9 w-9 rounded-lg skywee-hairline bg-foreground/[0.03] grid place-items-center mb-3 group-hover:scale-105 transition-transform">
                  <Icon size={16} />
                </div>
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                  {m.desc}
                </div>
              </motion.div>
            )
          })}
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
