"use client"

import { Leaf } from "lucide-react"
import { PageHeader } from "../page-header"
import { CarbonGuardModule } from "../modules/carbon-guard"

export function CarbonGuardPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Module 05"
        title="CarbonGuard"
        titleAccent="— autonomous carbon verification."
        description="Tokenize carbon credits as RWA. A verification agent pulls satellite + IoT data through x402-paid data APIs, validates project claims, and autonomously burns credits on-chain when deforestation or non-performance is detected — solving the trust crisis in voluntary carbon markets."
        icon={Leaf}
      />
      <CarbonGuardModule />
    </div>
  )
}
