/**
 * SKYWEE deployment configuration.
 *
 * Defines the 5 contracts to deploy, the 8 initial agents to register
 * on-chain, and the network configuration. Used by scripts/deploy.ts.
 */

export interface ContractSpec {
  /** Module name in the Odra crate */
  module: string
  /** Contract name (used in env var) */
  envVar: string
  /** Display name */
  name: string
  /** Description for logging */
  description: string
}

export interface SeedAgentSpec {
  name: string
  role: string
  pricePerRequest: number
  reputation: number
  /** Owner address — left empty to use deployer key */
  ownerAddress?: string
}

export interface NetworkConfig {
  name: string
  rpcUrl: string
  /** Chain name for deploy construction */
  chainName: string
  /** Block time in ms (for status display) */
  blockTimeMs: number
  /** Currency symbol */
  currencySymbol: string
  /** Explorer URL */
  explorerUrl: string
  /** SSE events URL (for odra-casper-livenet-env event stream) */
  eventsUrl: string
}

// =========================================================================
// 5 SKYWEE contracts to deploy
// =========================================================================

export const CONTRACTS: ContractSpec[] = [
  {
    module: "agent_registry",
    envVar: "CONTRACT_AGENT_REGISTRY",
    name: "AgentRegistry",
    description: "AgentSquare — agent registration & reputation",
  },
  {
    module: "insurance",
    envVar: "CONTRACT_INSURANCE",
    name: "InsuranceContract",
    description: "Aegis — parametric insurance with autonomous payout",
  },
  {
    module: "treasury",
    envVar: "CONTRACT_TREASURY",
    name: "TreasuryContract",
    description: "SwarmTreasury — multi-agent DAO execution",
  },
  {
    module: "rwa_vault",
    envVar: "CONTRACT_RWA_VAULT",
    name: "RwaVault",
    description: "RWA-X Vault — fractionalization + agent AMM",
  },
  {
    module: "carbon_guard",
    envVar: "CONTRACT_CARBON_GUARD",
    name: "CarbonGuard",
    description: "CarbonGuard — autonomous carbon verification",
  },
]

// =========================================================================
// 8 initial SKYWEE agents to seed on-chain
// =========================================================================

export const SEED_AGENTS: SeedAgentSpec[] = [
  {
    name: "RYSK-7",
    role: "risk-scorer",
    pricePerRequest: 0.42,
    reputation: 98,
  },
  {
    name: "YLR-3",
    role: "yield-router",
    pricePerRequest: 0.18,
    reputation: 95,
  },
  {
    name: "EXE-Max",
    role: "executor",
    pricePerRequest: 0,
    reputation: 96,
  },
  {
    name: "ORC-12",
    role: "oracle",
    pricePerRequest: 0.31,
    reputation: 92,
  },
  {
    name: "MM-Aria",
    role: "market-maker",
    pricePerRequest: 0.12,
    reputation: 94,
  },
  {
    name: "VER-Gaia",
    role: "verifier",
    pricePerRequest: 0.55,
    reputation: 99,
  },
  {
    name: "CMP-Vera",
    role: "compliance",
    pricePerRequest: 0.38,
    reputation: 91,
  },
  {
    name: "TRS-Odin",
    role: "treasurer",
    pricePerRequest: 0,
    reputation: 97,
  },
]

// =========================================================================
// Network configurations
// =========================================================================

export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: "casper-test",
    rpcUrl: "https://rpc.testnet.casper.network/rpc",
    chainName: "casper-test",
    blockTimeMs: 16_000,
    currencySymbol: "CSPR",
    explorerUrl: "https://testnet.cspr.live",
    eventsUrl: "https://events.testnet.casper.network",
  },
  mainnet: {
    name: "casper",
    rpcUrl: "https://rpc.mainnet.casper.network/rpc",
    chainName: "casper",
    blockTimeMs: 32_000,
    currencySymbol: "CSPR",
    explorerUrl: "https://cspr.live",
    eventsUrl: "https://events.casper.network",
  },
}

// =========================================================================
// Authorized monitor & verifier addresses (for Aegis + CarbonGuard)
// These would be the actual agent wallet addresses in production.
// =========================================================================

export const AUTHORIZED_MONITORS = [
  // ORC-12 oracle agent (Aegis monitoring)
  "0202ab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d",
]

export const AUTHORIZED_VERIFIERS = [
  // VER-Gaia verifier agent (CarbonGuard)
  "0202f0381c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b",
]

export const SWARM_AGENTS = [
  // SwarmTreasury agent whitelist (Yield, Risk, Compliance, Treasurer, Executor)
  { addr: "020291b34e7d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7", role: "yield-router", reputation: 95 },
  { addr: "02024f7a91c2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f80123456789abcdef0", role: "risk-scorer", reputation: 98 },
  { addr: "020277a89d3e2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8", role: "compliance", reputation: 91 },
  { addr: "0202c2d555b14a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0", role: "treasurer", reputation: 97 },
  { addr: "020233c18a02b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7", role: "executor", reputation: 96 },
]
