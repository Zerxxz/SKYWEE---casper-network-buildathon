"use client"

import { Layers } from "lucide-react"
import { PageHeader } from "../page-header"
import { RwaVaultModule } from "../modules/rwa-vault"

export function RwaVaultPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Module 04"
        title="RWA-X Vault"
        titleAccent="— agent-managed RWA AMM."
        description="Fractionalize invoices, trade-finance receivables, and other RWAs into Casper-native tokens. An autonomous market-maker agent runs Dutch auctions for new issuances and rebalances the liquidity curve in real time based on demand prediction."
        icon={Layers}
      />
      <RwaVaultModule />
    </div>
  )
}
