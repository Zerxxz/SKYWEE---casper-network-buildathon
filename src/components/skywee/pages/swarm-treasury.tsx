"use client"

import { Users } from "lucide-react"
import { PageHeader } from "../page-header"
import { SwarmTreasuryModule } from "../modules/swarm-treasury"

export function SwarmTreasuryPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Module 03"
        title="SwarmTreasury"
        titleAccent="— multi-agent DAO execution."
        description="A swarm of specialized agents — Yield Router, Risk Scorer, Compliance, Treasurer — deliberate on-chain before any treasury action. Small actions auto-execute via 2-of-3 consensus; large actions become governance proposals with full deliberation trail stored on Casper."
        icon={Users}
      />
      <SwarmTreasuryModule />
    </div>
  )
}
