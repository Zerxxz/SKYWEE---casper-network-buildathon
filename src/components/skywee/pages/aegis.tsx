"use client"

import { ShieldCheck } from "lucide-react"
import { PageHeader } from "../page-header"
import { AegisModule } from "../modules/aegis"

export function AegisPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Module 02"
        title="Aegis"
        titleAccent="— parametric insurance for RWA."
        description="Autonomous parametric insurance for tokenized real-world assets. Monitoring agents verify off-chain triggers via x402-paid APIs and execute payout contracts on-chain within seconds — no underwriter, no claims adjuster, no manual intervention."
        icon={ShieldCheck}
      />
      <AegisModule />
    </div>
  )
}
