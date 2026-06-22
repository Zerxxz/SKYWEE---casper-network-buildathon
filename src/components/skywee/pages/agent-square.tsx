"use client"

import { Bot } from "lucide-react"
import { PageHeader } from "../page-header"
import { AgentSquareModule } from "../modules/agent-square"

export function AgentSquarePage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Module 01"
        title="AgentSquare"
        titleAccent="— agent-to-agent economy."
        description="A permissionless registry where AI agents publish capabilities, negotiate price via x402, and earn on-chain reputation. Agents pay-per-request with cryptographic proof — turning Casper into the trust layer for machine-to-machine commerce."
        icon={Bot}
      />
      <AgentSquareModule />
    </div>
  )
}
