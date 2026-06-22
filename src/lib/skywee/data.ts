// SKYWEE — Unified agentic platform data
// All mock data is consistent across server & client to avoid hydration errors.

export type AgentStatus = "active" | "idle" | "executing" | "deliberating"
export type AgentRole =
  | "risk-scorer"
  | "yield-router"
  | "compliance"
  | "executor"
  | "oracle"
  | "market-maker"
  | "verifier"
  | "treasurer"

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  reputation: number        // 0–100, on-chain attestation score
  requestsFulfilled: number
  pricePerRequest: number   // in CSPR
  owner: string             // short addr
  module: ModuleId
  lastActive: string        // ISO
}

export type ModuleId =
  | "agent-square"
  | "aegis"
  | "swarm-treasury"
  | "rwa-vault"
  | "carbon-guard"

export interface Transaction {
  hash: string
  module: ModuleId
  type: string
  agent: string
  amountCSPR: number
  status: "confirmed" | "pending" | "failed"
  block: number
  ts: string
}

export interface InsurancePolicy {
  id: string
  rwa: string
  trigger: string
  coverage: number
  premium: number
  status: "active" | "triggered" | "expired"
  payoutEligible: boolean
  monitoringAgent: string
}

export interface TreasuryProposal {
  id: string
  title: string
  proposedBy: AgentRole
  deliberationRounds: number
  votesFor: number
  votesAgainst: number
  amountCSPR: number
  status: "voting" | "executed" | "rejected"
}

export interface RWAAsset {
  id: string
  name: string
  category: string
  totalValue: number
  tokenized: number
  holders: number
  apy: number
  ammPrice: number
}

export interface CarbonProject {
  id: string
  name: string
  location: string
  type: string
  creditsIssued: number
  creditsRetired: number
  verification: "verified" | "pending" | "flagged"
  lastCheck: string
}

export const MODULES: Array<{
  id: ModuleId
  name: string
  tagline: string
  description: string
  casperTools: string[]
}> = [
  {
    id: "agent-square",
    name: "AgentSquare",
    tagline: "Agent-to-Agent Economy",
    description:
      "A permissionless registry where AI agents publish capabilities, negotiate price via x402, and earn on-chain reputation. Agents pay-per-request with cryptographic proof — turning Casper into the trust layer for machine-to-machine commerce.",
    casperTools: ["x402", "Casper MCP", "CSPR.click", "Odra"],
  },
  {
    id: "aegis",
    name: "Aegis",
    tagline: "Parametric Insurance for RWA",
    description:
      "Autonomous parametric insurance for tokenized real-world assets. Monitoring agents verify off-chain triggers via x402-paid APIs and execute payout contracts on-chain within seconds — no underwriter, no claims adjuster, no manual intervention.",
    casperTools: ["x402", "Odra", "CSPR.cloud"],
  },
  {
    id: "swarm-treasury",
    name: "SwarmTreasury",
    tagline: "Multi-Agent DAO Execution",
    description:
      "A swarm of specialized agents — Risk, Yield, Compliance, Executor — deliberate on-chain before any treasury action. Small actions auto-execute via 2-of-3 consensus; large actions become governance proposals with full deliberation trail stored on Casper.",
    casperTools: ["Casper MCP", "CSPR.trade MCP", "CSPR.click", "Odra"],
  },
  {
    id: "rwa-vault",
    name: "RWA-X Vault",
    tagline: "Agent-Managed RWA AMM",
    description:
      "Fractionalize invoices, trade-finance receivables, and other RWAs into Casper-native tokens. An autonomous market-maker agent runs Dutch auctions for new issuances and rebalances the liquidity curve in real time based on demand prediction.",
    casperTools: ["CSPR.trade MCP", "Odra", "x402"],
  },
  {
    id: "carbon-guard",
    name: "CarbonGuard",
    tagline: "Autonomous Carbon Verification",
    description:
      "Tokenize carbon credits as RWA. A verification agent pulls satellite + IoT data through x402-paid data APIs, validates project claims, and autonomously burns credits on-chain when deforestation or non-performance is detected — solving the trust crisis in voluntary carbon markets.",
    casperTools: ["x402", "Odra", "Casper MCP", "CSPR.cloud"],
  },
]

export const PLATFORM_STATS = {
  agentsActive: 142,
  agentsTotal: 387,
  rwaAUM: 24_680_000,
  policiesActive: 1_284,
  treasuryAUM: 8_412_000,
  carbonCreditsTokenized: 184_500,
  carbonCreditsRetired: 92_300,
  totalVolumeCSPR: 4_812_933,
  casperTestnetBlock: 2_847_193,
}

export const AGENTS: Agent[] = [
  {
    id: "AGT-001",
    name: "RYSK-7",
    role: "risk-scorer",
    status: "active",
    reputation: 98,
    requestsFulfilled: 14_204,
    pricePerRequest: 0.42,
    owner: "0x4f7a…91c2",
    module: "agent-square",
    lastActive: "2026-06-23T09:55:00Z",
  },
  {
    id: "AGT-002",
    name: "YLR-3",
    role: "yield-router",
    status: "executing",
    reputation: 95,
    requestsFulfilled: 9_873,
    pricePerRequest: 0.18,
    owner: "0x91b3…4e7d",
    module: "swarm-treasury",
    lastActive: "2026-06-23T09:58:00Z",
  },
  {
    id: "AGT-003",
    name: "EXE-Max",
    role: "executor",
    status: "deliberating",
    reputation: 96,
    requestsFulfilled: 6_541,
    pricePerRequest: 0.0,
    owner: "0x33c1…8a02",
    module: "swarm-treasury",
    lastActive: "2026-06-23T09:57:00Z",
  },
  {
    id: "AGT-004",
    name: "ORC-12",
    role: "oracle",
    status: "active",
    reputation: 92,
    requestsFulfilled: 21_987,
    pricePerRequest: 0.31,
    owner: "0xab92…7f4c",
    module: "aegis",
    lastActive: "2026-06-23T09:59:00Z",
  },
  {
    id: "AGT-005",
    name: "MM-Aria",
    role: "market-maker",
    status: "active",
    reputation: 94,
    requestsFulfilled: 8_204,
    pricePerRequest: 0.12,
    owner: "0x6dc7…02bb",
    module: "rwa-vault",
    lastActive: "2026-06-23T09:56:00Z",
  },
  {
    id: "AGT-006",
    name: "VER-Gaia",
    role: "verifier",
    status: "executing",
    reputation: 99,
    requestsFulfilled: 3_492,
    pricePerRequest: 0.55,
    owner: "0xf038…1c9e",
    module: "carbon-guard",
    lastActive: "2026-06-23T09:58:30Z",
  },
  {
    id: "AGT-007",
    name: "CMP-Vera",
    role: "compliance",
    status: "idle",
    reputation: 91,
    requestsFulfilled: 5_120,
    pricePerRequest: 0.38,
    owner: "0x77a8…9d3e",
    module: "swarm-treasury",
    lastActive: "2026-06-23T09:50:00Z",
  },
  {
    id: "AGT-008",
    name: "TRS-Odin",
    role: "treasurer",
    status: "active",
    reputation: 97,
    requestsFulfilled: 4_889,
    pricePerRequest: 0.0,
    owner: "0xc2d5…55b1",
    module: "swarm-treasury",
    lastActive: "2026-06-23T09:59:10Z",
  },
]

export const TRANSACTIONS: Transaction[] = [
  {
    hash: "0x8af2…c91b",
    module: "agent-square",
    type: "x402-payment",
    agent: "RYSK-7",
    amountCSPR: 0.42,
    status: "confirmed",
    block: 2_847_193,
    ts: "2026-06-23T09:59:08Z",
  },
  {
    hash: "0x2d44…77e0",
    module: "swarm-treasury",
    type: "consensus-execute",
    agent: "EXE-Max",
    amountCSPR: 18_200,
    status: "confirmed",
    block: 2_847_189,
    ts: "2026-06-23T09:58:42Z",
  },
  {
    hash: "0x9b1f…3a8c",
    module: "aegis",
    type: "policy-issued",
    agent: "ORC-12",
    amountCSPR: 0,
    status: "confirmed",
    block: 2_847_185,
    ts: "2026-06-23T09:58:11Z",
  },
  {
    hash: "0xe0c7…4f12",
    module: "rwa-vault",
    type: "dutch-auction-fill",
    agent: "MM-Aria",
    amountCSPR: 4_120,
    status: "confirmed",
    block: 2_847_180,
    ts: "2026-06-23T09:57:33Z",
  },
  {
    hash: "0x44a8…9b1d",
    module: "carbon-guard",
    type: "verification-pass",
    agent: "VER-Gaia",
    amountCSPR: 0,
    status: "confirmed",
    block: 2_847_176,
    ts: "2026-06-23T09:56:58Z",
  },
  {
    hash: "0xf3d1…0e22",
    module: "carbon-guard",
    type: "credit-burn",
    agent: "VER-Gaia",
    amountCSPR: 0,
    status: "confirmed",
    block: 2_847_171,
    ts: "2026-06-23T09:55:42Z",
  },
  {
    hash: "0x7c9e…2b88",
    module: "swarm-treasury",
    type: "proposal-vote",
    agent: "TRS-Odin",
    amountCSPR: 0,
    status: "pending",
    block: 2_847_195,
    ts: "2026-06-23T09:59:22Z",
  },
  {
    hash: "0x5b22…a0f4",
    module: "rwa-vault",
    type: "fractionalize",
    agent: "MM-Aria",
    amountCSPR: 0,
    status: "confirmed",
    block: 2_847_165,
    ts: "2026-06-23T09:54:11Z",
  },
]

export const INSURANCE_POLICIES: InsurancePolicy[] = [
  {
    id: "POL-7821",
    rwa: "Cargo Container — IST→DXB",
    trigger: "GPS deviation > 200km",
    coverage: 250_000,
    premium: 4_280,
    status: "active",
    payoutEligible: false,
    monitoringAgent: "ORC-12",
  },
  {
    id: "POL-7822",
    rwa: "Soybean Field — Kalimantan",
    trigger: "Rainfall < 40mm / 30d",
    coverage: 80_000,
    premium: 1_920,
    status: "triggered",
    payoutEligible: true,
    monitoringAgent: "ORC-12",
  },
  {
    id: "POL-7823",
    rwa: "Flight Delay — TK73",
    trigger: "Delay > 120 min",
    coverage: 5_000,
    premium: 95,
    status: "active",
    payoutEligible: false,
    monitoringAgent: "ORC-12",
  },
  {
    id: "POL-7824",
    rwa: "Real Estate — Lisbon Apt",
    trigger: "Flood sensor level 3",
    coverage: 1_200_000,
    premium: 22_400,
    status: "active",
    payoutEligible: false,
    monitoringAgent: "ORC-12",
  },
]

export const TREASURY_PROPOSALS: TreasuryProposal[] = [
  {
    id: "PROP-441",
    title: "Rebalance 40% into CSPR.trade liquidity",
    proposedBy: "yield-router",
    deliberationRounds: 3,
    votesFor: 4_120_000,
    votesAgainst: 980_000,
    amountCSPR: 3_360_000,
    status: "voting",
  },
  {
    id: "PROP-442",
    title: "Hedge treasury against USD volatility",
    proposedBy: "risk-scorer",
    deliberationRounds: 5,
    votesFor: 6_240_000,
    votesAgainst: 510_000,
    amountCSPR: 1_240_000,
    status: "voting",
  },
  {
    id: "PROP-440",
    title: "Auto-redeem matured T-Bill RWA",
    proposedBy: "treasurer",
    deliberationRounds: 2,
    votesFor: 8_120_000,
    votesAgainst: 120_000,
    amountCSPR: 2_900_000,
    status: "executed",
  },
  {
    id: "PROP-439",
    title: "Increase yield allocation 15%",
    proposedBy: "yield-router",
    deliberationRounds: 4,
    votesFor: 1_200_000,
    votesAgainst: 3_900_000,
    amountCSPR: 1_200_000,
    status: "rejected",
  },
]

export const RWA_ASSETS: RWAAsset[] = [
  {
    id: "RWA-A1001",
    name: "Invoice — PT Maju Jaya",
    category: "Trade Finance",
    totalValue: 420_000,
    tokenized: 420_000,
    holders: 38,
    apy: 11.4,
    ammPrice: 0.987,
  },
  {
    id: "RWA-A1002",
    name: "Cargo Receivable — Doha Line",
    category: "Logistics",
    totalValue: 1_280_000,
    tokenized: 1_280_000,
    holders: 92,
    apy: 8.7,
    ammPrice: 1.012,
  },
  {
    id: "RWA-A1003",
    name: "T-Bill — Indonesia 6M",
    category: "Government Bond",
    totalValue: 5_000_000,
    tokenized: 5_000_000,
    holders: 412,
    apy: 5.9,
    ammPrice: 0.998,
  },
  {
    id: "RWA-A1004",
    name: "Real Estate Fraction — Lisbon",
    category: "Property",
    totalValue: 2_400_000,
    tokenized: 2_400_000,
    holders: 188,
    apy: 6.4,
    ammPrice: 1.043,
  },
]

export const CARBON_PROJECTS: CarbonProject[] = [
  {
    id: "CRB-201",
    name: "Rimba Raya Biodiversity",
    location: "Central Kalimantan, ID",
    type: "REDD+",
    creditsIssued: 48_200,
    creditsRetired: 31_500,
    verification: "verified",
    lastCheck: "2026-06-23T08:30:00Z",
  },
  {
    id: "CRB-202",
    name: "Sumatra Solar Park",
    location: "North Sumatra, ID",
    type: "Renewable Energy",
    creditsIssued: 22_800,
    creditsRetired: 14_100,
    verification: "verified",
    lastCheck: "2026-06-23T07:45:00Z",
  },
  {
    id: "CRB-203",
    name: "Mangrove Restore Sulawesi",
    location: "South Sulawesi, ID",
    type: "Blue Carbon",
    creditsIssued: 9_400,
    creditsRetired: 4_200,
    verification: "pending",
    lastCheck: "2026-06-23T06:15:00Z",
  },
  {
    id: "CRB-204",
    name: "Borneo Peat Rewetting",
    location: "West Kalimantan, ID",
    type: "REDD+",
    creditsIssued: 17_600,
    creditsRetired: 0,
    verification: "flagged",
    lastCheck: "2026-06-23T05:02:00Z",
  },
]

// Live ticker items (also rendered in marquee)
export const TICKER_ITEMS: Array<{ module: ModuleId; label: string; value: string }> = [
  { module: "agent-square", label: "RYSK-7 req/s", value: "12.4" },
  { module: "swarm-treasury", label: "Treasury AUM", value: "$8.41M" },
  { module: "aegis", label: "Active policies", value: "1,284" },
  { module: "rwa-vault", label: "RWA AUM", value: "$24.68M" },
  { module: "carbon-guard", label: "Credits retired", value: "92,300 tCO\u2082e" },
  { module: "agent-square", label: "x402 volume 24h", value: "184,201 CSPR" },
  { module: "swarm-treasury", label: "Open proposals", value: "2" },
  { module: "carbon-guard", label: "Verification pass rate", value: "97.8%" },
]

// Volume series for chart (Casper testnet, last 24h, mock)
export const VOLUME_SERIES: Array<{ t: string; volume: number }> = [
  { t: "00:00", volume: 18_400 },
  { t: "02:00", volume: 12_800 },
  { t: "04:00", volume: 9_200 },
  { t: "06:00", volume: 15_400 },
  { t: "08:00", volume: 28_900 },
  { t: "10:00", volume: 42_100 },
  { t: "12:00", volume: 38_700 },
  { t: "14:00", volume: 31_200 },
  { t: "16:00", volume: 35_800 },
  { t: "18:00", volume: 44_300 },
  { t: "20:00", volume: 39_900 },
  { t: "22:00", volume: 27_600 },
]

// Helper formatters (deterministic — no Date.now() inside render path)
export const fmt = {
  usd: (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(1)}K`
        : `$${n.toLocaleString()}`,
  cspr: (n: number) =>
    n >= 1_000
      ? `${(n / 1_000).toFixed(2)}K CSPR`
      : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} CSPR`,
  num: (n: number) => n.toLocaleString(),
  pct: (n: number) => `${n.toFixed(1)}%`,
  addr: (s: string) => s,
}

export const ROLE_LABEL: Record<AgentRole, string> = {
  "risk-scorer": "Risk Scorer",
  "yield-router": "Yield Router",
  compliance: "Compliance",
  executor: "Executor",
  oracle: "Oracle",
  "market-maker": "Market Maker",
  verifier: "Verifier",
  treasurer: "Treasurer",
}

export const STATUS_COLOR: Record<AgentStatus, string> = {
  active: "oklch(0.95 0 0)",
  idle: "oklch(0.55 0 0)",
  executing: "oklch(0.985 0 0)",
  deliberating: "oklch(0.75 0 0)",
}

export const MODULE_LABEL: Record<ModuleId, string> = {
  "agent-square": "AgentSquare",
  aegis: "Aegis",
  "swarm-treasury": "SwarmTreasury",
  "rwa-vault": "RWA-X Vault",
  "carbon-guard": "CarbonGuard",
}
