/**
 * SKYWEE — Database seed script.
 * Seeds initial agents, policies, proposals, RWA assets, carbon projects,
 * and a few sample transactions so the app has data on first load.
 *
 * Run with: `bun run scripts/seed.ts`
 */
import { db } from "../src/lib/db"

async function main() {
  console.log("🌱 Seeding SKYWEE database...")

  // Clear existing data (idempotent re-seed)
  await db.transaction.deleteMany()
  await db.deliberation.deleteMany()
  await db.proposal.deleteMany()
  await db.policy.deleteMany()
  await db.rwaAsset.deleteMany()
  await db.carbonProject.deleteMany()
  await db.agent.deleteMany()

  // =================== AGENTS ===================
  const agents = [
    { onChainId: 1, name: "RYSK-7", role: "risk-scorer", ownerAddress: "0x4f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", pricePerRequest: 0.42, reputation: 98, requestsFulfilled: 14204, active: true, module: "agent-square" },
    { onChainId: 2, name: "YLR-3", role: "yield-router", ownerAddress: "0x91b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f", pricePerRequest: 0.18, reputation: 95, requestsFulfilled: 9873, active: true, module: "swarm-treasury" },
    { onChainId: 3, name: "EXE-Max", role: "executor", ownerAddress: "0x33c18a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8", pricePerRequest: 0, reputation: 96, requestsFulfilled: 6541, active: true, module: "swarm-treasury" },
    { onChainId: 4, name: "ORC-12", role: "oracle", ownerAddress: "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e", pricePerRequest: 0.31, reputation: 92, requestsFulfilled: 21987, active: true, module: "aegis" },
    { onChainId: 5, name: "MM-Aria", role: "market-maker", ownerAddress: "0x6dc702bb4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d", pricePerRequest: 0.12, reputation: 94, requestsFulfilled: 8204, active: true, module: "rwa-vault" },
    { onChainId: 6, name: "VER-Gaia", role: "verifier", ownerAddress: "0xf0381c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a", pricePerRequest: 0.55, reputation: 99, requestsFulfilled: 3492, active: true, module: "carbon-guard" },
    { onChainId: 7, name: "CMP-Vera", role: "compliance", ownerAddress: "0x77a89d3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f", pricePerRequest: 0.38, reputation: 91, requestsFulfilled: 5120, active: false, module: "swarm-treasury" },
    { onChainId: 8, name: "TRS-Odin", role: "treasurer", ownerAddress: "0xc2d555b14a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d", pricePerRequest: 0, reputation: 97, requestsFulfilled: 4889, active: true, module: "swarm-treasury" },
  ]

  for (const a of agents) {
    await db.agent.create({ data: a })
  }
  console.log(`✓ Seeded ${agents.length} agents`)

  // =================== POLICIES ===================
  const policies = [
    { onChainId: 7821, rwaId: "RWA-LOG-201", rwaName: "Cargo Container — IST→DXB", trigger: "GPS deviation > 200km", coverage: 250000, premium: 4280, policyholder: "0xc2d555b14a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d", monitorAddress: "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e", status: "active", payoutEligible: false },
    { onChainId: 7822, rwaId: "RWA-AGR-102", rwaName: "Soybean Field — Kalimantan", trigger: "Rainfall < 40mm / 30d", coverage: 80000, premium: 1920, policyholder: "0x4f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", monitorAddress: "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e", status: "triggered", payoutEligible: true },
    { onChainId: 7823, rwaId: "RWA-FLG-042", rwaName: "Flight Delay — TK73", trigger: "Delay > 120 min", coverage: 5000, premium: 95, policyholder: "0x33c18a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8", monitorAddress: "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e", status: "active", payoutEligible: false },
    { onChainId: 7824, rwaId: "RWA-RE-007", rwaName: "Real Estate — Lisbon Apt", trigger: "Flood sensor level 3", coverage: 1200000, premium: 22400, policyholder: "0x91b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f", monitorAddress: "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e", status: "active", payoutEligible: false },
  ]
  for (const p of policies) {
    await db.policy.create({ data: p })
  }
  console.log(`✓ Seeded ${policies.length} policies`)

  // =================== PROPOSALS ===================
  const proposals = [
    { onChainId: 441, title: "Rebalance 40% into CSPR.trade liquidity", proposedBy: "0x91b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f", proposerRole: "yield-router", amountCSPR: 3360000, votesFor: 4120000, votesAgainst: 980000, deliberationRounds: 3, status: "voting" },
    { onChainId: 442, title: "Hedge treasury against USD volatility", proposedBy: "0x4f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", proposerRole: "risk-scorer", amountCSPR: 1240000, votesFor: 6240000, votesAgainst: 510000, deliberationRounds: 5, status: "voting" },
    { onChainId: 440, title: "Auto-redeem matured T-Bill RWA", proposedBy: "0xc2d555b14a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d", proposerRole: "treasurer", amountCSPR: 2900000, votesFor: 8120000, votesAgainst: 120000, deliberationRounds: 2, status: "executed" },
    { onChainId: 439, title: "Increase yield allocation 15%", proposedBy: "0x91b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f", proposerRole: "yield-router", amountCSPR: 1200000, votesFor: 1200000, votesAgainst: 3900000, deliberationRounds: 4, status: "rejected" },
  ]
  for (const p of proposals) {
    await db.proposal.create({ data: p })
  }
  console.log(`✓ Seeded ${proposals.length} proposals`)

  // =================== DELIBERATIONS ===================
  const prop441 = await db.proposal.findUnique({ where: { onChainId: 441 } })
  if (prop441) {
    const deliberations = [
      { agentAddr: "0x91b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f", agentRole: "yield-router", message: "Detected 4.2% yield improvement on CSPR.trade CSPR/csprUSD pool. Proposing 40% rebalance.", round: 1, blockHeight: 2847175 },
      { agentAddr: "0x4f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8", agentRole: "risk-scorer", message: "Risk score 0.71 — within tolerance. IL exposure acceptable at current volatility band.", round: 2, blockHeight: 2847178 },
      { agentAddr: "0x77a89d3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f", agentRole: "compliance", message: "No sanctions hits. Pool contract audited. Approved for execution.", round: 3, blockHeight: 2847182 },
      { agentAddr: "0xc2d555b14a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d", agentRole: "treasurer", message: "Consensus reached (3/3). Opening governance vote — amount exceeds auto-execute threshold.", round: 3, blockHeight: 2847186 },
      { agentAddr: "0x33c18a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8", agentRole: "executor", message: "Standing by for governance outcome. Will sign if quorum met within 48h.", round: 3, blockHeight: 2847190 },
    ]
    for (const d of deliberations) {
      await db.deliberation.create({ data: { ...d, proposalId: prop441.id } })
    }
    console.log(`✓ Seeded ${deliberations.length} deliberations`)
  }

  // =================== RWA ASSETS ===================
  const rwaAssets = [
    { onChainId: 1001, name: "Invoice — PT Maju Jaya", category: "Trade Finance", totalValue: 420000, tokenized: 420000, holders: 38, apy: 11.4, ammPrice: 0.987 },
    { onChainId: 1002, name: "Cargo Receivable — Doha Line", category: "Logistics", totalValue: 1280000, tokenized: 1280000, holders: 92, apy: 8.7, ammPrice: 1.012 },
    { onChainId: 1003, name: "T-Bill — Indonesia 6M", category: "Government Bond", totalValue: 5000000, tokenized: 5000000, holders: 412, apy: 5.9, ammPrice: 0.998 },
    { onChainId: 1004, name: "Real Estate Fraction — Lisbon", category: "Property", totalValue: 2400000, tokenized: 2400000, holders: 188, apy: 6.4, ammPrice: 1.043 },
  ]
  for (const a of rwaAssets) {
    await db.rwaAsset.create({ data: a })
  }
  console.log(`✓ Seeded ${rwaAssets.length} RWA assets`)

  // =================== CARBON PROJECTS ===================
  const carbonProjects = [
    { onChainId: 201, name: "Rimba Raya Biodiversity", location: "Central Kalimantan, ID", projectType: "REDD+", creditsIssued: 48200, creditsRetired: 31500, verification: "verified" },
    { onChainId: 202, name: "Sumatra Solar Park", location: "North Sumatra, ID", projectType: "Renewable Energy", creditsIssued: 22800, creditsRetired: 14100, verification: "verified" },
    { onChainId: 203, name: "Mangrove Restore Sulawesi", location: "South Sulawesi, ID", projectType: "Blue Carbon", creditsIssued: 9400, creditsRetired: 4200, verification: "pending" },
    { onChainId: 204, name: "Borneo Peat Rewetting", location: "West Kalimantan, ID", projectType: "REDD+", creditsIssued: 17600, creditsRetired: 0, verification: "flagged" },
  ]
  for (const p of carbonProjects) {
    await db.carbonProject.create({ data: p })
  }
  console.log(`✓ Seeded ${carbonProjects.length} carbon projects`)

  // =================== TRANSACTIONS ===================
  const txs = [
    { hash: "0x8af2c91b7d3e4a5f6b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a", module: "agent-square", type: "x402-payment", agentName: "RYSK-7", amountCSPR: 0.42, status: "confirmed", blockHeight: 2847193, callerAddr: "0x4f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8" },
    { hash: "0x2d4477e03a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c", module: "swarm-treasury", type: "consensus-execute", agentName: "EXE-Max", amountCSPR: 18200, status: "confirmed", blockHeight: 2847189, callerAddr: "0x33c18a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8" },
    { hash: "0x9b1f3a8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a", module: "aegis", type: "policy-issued", agentName: "ORC-12", amountCSPR: 0, status: "confirmed", blockHeight: 2847185 },
    { hash: "0xe0c74f123a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0", module: "rwa-vault", type: "dutch-auction-fill", agentName: "MM-Aria", amountCSPR: 4120, status: "confirmed", blockHeight: 2847180 },
    { hash: "0x44a89b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9", module: "carbon-guard", type: "verification-pass", agentName: "VER-Gaia", amountCSPR: 0, status: "confirmed", blockHeight: 2847176 },
    { hash: "0xf3d10e222b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9", module: "carbon-guard", type: "credit-burn", agentName: "VER-Gaia", amountCSPR: 0, status: "confirmed", blockHeight: 2847171 },
    { hash: "0x7c9e2b884a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c", module: "swarm-treasury", type: "proposal-vote", agentName: "TRS-Odin", amountCSPR: 0, status: "pending", blockHeight: 2847195 },
    { hash: "0x5b22a0f46c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e", module: "rwa-vault", type: "fractionalize", agentName: "MM-Aria", amountCSPR: 0, status: "confirmed", blockHeight: 2847165 },
  ]
  for (const t of txs) {
    await db.transaction.create({ data: t })
  }
  console.log(`✓ Seeded ${txs.length} transactions`)

  console.log("\n✅ SKYWEE database seeded successfully.")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
