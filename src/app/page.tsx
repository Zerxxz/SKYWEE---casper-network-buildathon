"use client"

import * as React from "react"
import { SidebarLayout, type PageId } from "@/components/skywee/sidebar-layout"
import { LandingPage } from "@/components/skywee/landing-page"
import { DashboardPage } from "@/components/skywee/pages/dashboard"
import { AgentSquarePage } from "@/components/skywee/pages/agent-square"
import { AegisPage } from "@/components/skywee/pages/aegis"
import { SwarmTreasuryPage } from "@/components/skywee/pages/swarm-treasury"
import { RwaVaultPage } from "@/components/skywee/pages/rwa-vault"
import { CarbonGuardPage } from "@/components/skywee/pages/carbon-guard"
import { StackPage } from "@/components/skywee/pages/stack"
import { BuildathonPage } from "@/components/skywee/pages/buildathon"

export default function Home() {
  // Landing page state — user starts on landing.
  // Two entry paths (handled inside LandingPage):
  //   1. "Connect Casper Wallet" → triggers Casper Wallet extension popup →
  //      on success, enters dashboard with wallet connected (real on-chain mode).
  //      If no extension installed, falls back to demo mode automatically.
  //   2. "Try Demo Mode" → enters dashboard in demo mode (no wallet required).
  // The wallet state (connected vs demo) is managed by WalletProvider —
  // page.tsx just tracks whether the user has entered the dashboard.
  const [entered, setEntered] = React.useState(false)
  const [page, setPage] = React.useState<PageId>("dashboard")

  const handleNavigate = React.useCallback((id: PageId) => {
    setPage(id)
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [])

  const handleEnter = React.useCallback(() => {
    setEntered(true)
  }, [])

  // Show landing page first
  if (!entered) {
    return <LandingPage onEnter={handleEnter} />
  }

  // After entering, show dashboard with sidebar
  return (
    <SidebarLayout active={page} onNavigate={handleNavigate}>
      {page === "dashboard" && <DashboardPage onNavigate={handleNavigate} />}
      {page === "agent-square" && <AgentSquarePage />}
      {page === "aegis" && <AegisPage />}
      {page === "swarm-treasury" && <SwarmTreasuryPage />}
      {page === "rwa-vault" && <RwaVaultPage />}
      {page === "carbon-guard" && <CarbonGuardPage />}
      {page === "stack" && <StackPage />}
      {page === "buildathon" && <BuildathonPage />}
    </SidebarLayout>
  )
}
