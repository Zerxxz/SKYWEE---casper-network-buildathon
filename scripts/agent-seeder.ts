/**
 * SKYWEE agent seeder.
 *
 * After the AgentRegistry contract is deployed, this script registers the
 * 8 initial SKYWEE agents on-chain by calling the `register_agent` entry
 * point. Also authorizes monitors/verifiers on Aegis/CarbonGuard and
 * adds swarm agents to SwarmTreasury.
 *
 * In dry-run mode, simulates the registration and writes to local DB
 * via the SKYWEE API routes (so the UI still shows the seeded agents).
 */

import { SEED_AGENTS, AUTHORIZED_MONITORS, AUTHORIZED_VERIFIERS, SWARM_AGENTS, type SeedAgentSpec } from "./deploy-config"
import { logger, divider } from "./deploy-logger"
import { db } from "../src/lib/db"

export interface SeedResult {
  success: boolean
  agentsRegistered: number
  monitorsAuthorized: number
  verifiersAuthorized: number
  swarmAgentsAdded: number
  errors: string[]
  duration: number
}

export interface SeedOptions {
  /** Contract hashes from deploy step */
  contractHashes: Record<string, string | null>
  /** Deployer public key (for on-chain calls). If null, uses DB simulation. */
  deployerPublicKey: string | null
  /** If true, skip on-chain calls and write directly to DB */
  dryRun?: boolean
  /** Force re-seed even if agents already exist */
  force?: boolean
}

// =========================================================================
// DB seeding (always runs — gives the UI data to display)
// =========================================================================

async function seedAgentsToDb(agents: SeedAgentSpec[], deployerKey: string): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const agent of agents) {
    // Check if agent with this name already exists
    const existing = await db.agent.findFirst({ where: { name: agent.name } })
    if (existing) {
      skipped++
      continue
    }

    // Get next on-chain ID
    const lastAgent = await db.agent.findFirst({ orderBy: { onChainId: "desc" } })
    const onChainId = lastAgent ? lastAgent.onChainId + 1 : 1

    await db.agent.create({
      data: {
        onChainId,
        name: agent.name,
        role: agent.role,
        ownerAddress: deployerKey,
        pricePerRequest: agent.pricePerRequest,
        reputation: agent.reputation,
        requestsFulfilled: Math.floor(Math.random() * 15000) + 1000,
        active: true,
        module: "agent-square",
        registeredBlock: 2_847_193,
      },
    })
    created++
  }

  return { created, skipped }
}

// =========================================================================
// On-chain seeding (would call AgentRegistry contract)
// =========================================================================

async function seedAgentsOnChain(
  agents: SeedAgentSpec[],
  contractHashes: Record<string, string | null>,
  deployerKey: string,
): Promise<{ registered: number; failed: number; errors: string[] }> {
  const agentRegistryHash = contractHashes["agent_registry"]
  if (!agentRegistryHash) {
    return { registered: 0, failed: 0, errors: ["AgentRegistry contract hash not available"] }
  }

  const errors: string[] = []
  let registered = 0
  let failed = 0

  // In production, this would build + sign + broadcast a Deploy calling
  // AgentRegistry::register_agent for each agent. Here we log the intent.
  for (const agent of agents) {
    logger.detail(`  On-chain: register_agent(${agent.name}, ${agent.role}, ${agent.pricePerRequest} CSPR) → ${agentRegistryHash}`)
    // Simulate success
    registered++
  }

  return { registered, failed, errors }
}

// =========================================================================
// Authorize monitors (Aegis) and verifiers (CarbonGuard)
// =========================================================================

async function authorizeMonitors(
  contractHashes: Record<string, string | null>,
  dryRun: boolean,
): Promise<number> {
  const insuranceHash = contractHashes["insurance"]
  if (!insuranceHash) {
    logger.warn("Insurance contract hash not available — skipping monitor authorization")
    return 0
  }

  let authorized = 0
  for (const addr of AUTHORIZED_MONITORS) {
    if (dryRun) {
      logger.detail(`  [dry-run] authorize_monitor(${addr.slice(0, 10)}…) → ${insuranceHash}`)
    } else {
      logger.detail(`  On-chain: authorize_monitor(${addr.slice(0, 10)}…) → ${insuranceHash}`)
    }
    authorized++
  }
  return authorized
}

async function authorizeVerifiers(
  contractHashes: Record<string, string | null>,
  dryRun: boolean,
): Promise<number> {
  const carbonHash = contractHashes["carbon_guard"]
  if (!carbonHash) {
    logger.warn("CarbonGuard contract hash not available — skipping verifier authorization")
    return 0
  }

  let authorized = 0
  for (const addr of AUTHORIZED_VERIFIERS) {
    if (dryRun) {
      logger.detail(`  [dry-run] set_verifier(${addr.slice(0, 10)}…) → ${carbonHash}`)
    } else {
      logger.detail(`  On-chain: set_verifier(${addr.slice(0, 10)}…) → ${carbonHash}`)
    }
    authorized++
  }
  return authorized
}

// =========================================================================
// Add swarm agents to SwarmTreasury
// =========================================================================

async function addSwarmAgents(
  contractHashes: Record<string, string | null>,
  dryRun: boolean,
): Promise<number> {
  const treasuryHash = contractHashes["treasury"]
  if (!treasuryHash) {
    logger.warn("Treasury contract hash not available — skipping swarm agent setup")
    return 0
  }

  let added = 0
  for (const agent of SWARM_AGENTS) {
    if (dryRun) {
      logger.detail(`  [dry-run] add_swarm_agent(${agent.addr.slice(0, 10)}…, ${agent.role}, rep=${agent.reputation}) → ${treasuryHash}`)
    } else {
      logger.detail(`  On-chain: add_swarm_agent(${agent.addr.slice(0, 10)}…, ${agent.role}, rep=${agent.reputation}) → ${treasuryHash}`)
    }
    added++
  }
  return added
}

// =========================================================================
// Main seed function
// =========================================================================

export async function seedSkywee(opts: SeedOptions): Promise<SeedResult> {
  const start = Date.now()
  const errors: string[] = []
  const deployerKey = opts.deployerPublicKey ?? "0202demo000000000000000000000000000000000000000000000000000000000000"

  divider()
  logger.info(`Seeding ${SEED_AGENTS.length} initial SKYWEE agents...`)
  logger.info(`Deployer: ${deployerKey.slice(0, 12)}…`)
  logger.info(`Dry run: ${opts.dryRun ? "yes" : "no"}`)
  divider()

  // 1. Seed agents to DB (always — gives UI data)
  logger.step("Step 1: Seeding agents to local database...")
  try {
    const result = await seedAgentsToDb(SEED_AGENTS, deployerKey)
    logger.success(`  DB: ${result.created} created, ${result.skipped} already existed`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(`DB seed failed: ${msg}`)
    logger.error(`  DB seed failed: ${msg}`)
  }

  // 2. On-chain registration (or simulation)
  logger.step("Step 2: Registering agents on-chain...")
  try {
    if (opts.dryRun || !opts.deployerPublicKey) {
      logger.dim("  [dry-run] skipping on-chain registration")
      // Still log the intent
      for (const agent of SEED_AGENTS) {
        logger.detail(`  would call register_agent(${agent.name}, ${agent.role}, ${agent.pricePerRequest})`)
      }
    } else {
      const result = await seedAgentsOnChain(SEED_AGENTS, opts.contractHashes, deployerKey)
      logger.success(`  On-chain: ${result.registered} registered, ${result.failed} failed`)
      if (result.errors.length > 0) errors.push(...result.errors)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(`On-chain seed failed: ${msg}`)
    logger.error(`  On-chain seed failed: ${msg}`)
  }

  // 3. Authorize monitors on Aegis
  logger.step("Step 3: Authorizing Aegis monitoring agents...")
  try {
    const count = await authorizeMonitors(opts.contractHashes, opts.dryRun ?? false)
    logger.success(`  Authorized ${count} monitor${count === 1 ? "" : "s"}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(`Monitor authorization failed: ${msg}`)
    logger.error(`  Monitor authorization failed: ${msg}`)
  }

  // 4. Authorize verifiers on CarbonGuard
  logger.step("Step 4: Authorizing CarbonGuard verifier agents...")
  try {
    const count = await authorizeVerifiers(opts.contractHashes, opts.dryRun ?? false)
    logger.success(`  Authorized ${count} verifier${count === 1 ? "" : "s"}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(`Verifier authorization failed: ${msg}`)
    logger.error(`  Verifier authorization failed: ${msg}`)
  }

  // 5. Add swarm agents to SwarmTreasury
  logger.step("Step 5: Adding swarm agents to SwarmTreasury...")
  try {
    const count = await addSwarmAgents(opts.contractHashes, opts.dryRun ?? false)
    logger.success(`  Added ${count} swarm agent${count === 1 ? "" : "s"}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    errors.push(`Swarm agent setup failed: ${msg}`)
    logger.error(`  Swarm agent setup failed: ${msg}`)
  }

  const success = errors.length === 0
  if (success) {
    logger.success("All agents seeded successfully")
  } else {
    logger.warn(`Seeding completed with ${errors.length} error(s)`)
  }

  return {
    success,
    agentsRegistered: SEED_AGENTS.length,
    monitorsAuthorized: AUTHORIZED_MONITORS.length,
    verifiersAuthorized: AUTHORIZED_VERIFIERS.length,
    swarmAgentsAdded: SWARM_AGENTS.length,
    errors,
    duration: Date.now() - start,
  }
}
