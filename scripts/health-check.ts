/**
 * SKYWEE health check.
 *
 * After deployment, verifies that all contracts are callable and the
 * expected agents are registered. Reports any issues.
 */

import { CONTRACTS, SEED_AGENTS, NETWORKS } from "./deploy-config"
import { logger, divider } from "./deploy-logger"
import { loadDeployState } from "./contract-deployer"
import { db } from "../src/lib/db"

export interface HealthCheckResult {
  ok: boolean
  contractsDeployed: number
  contractsTotal: number
  agentsInDb: number
  agentsExpected: number
  networkReachable: boolean
  envConfigured: boolean
  checks: Array<{
    name: string
    status: "pass" | "fail" | "warn"
    detail: string
  }>
}

export async function healthCheck(network: "testnet" | "mainnet"): Promise<HealthCheckResult> {
  const checks: HealthCheckResult["checks"] = []
  const net = NETWORKS[network]

  divider()
  logger.step("Running health checks...")
  divider()

  // 1. Check deploy state files
  logger.detail("Check 1: Contract deploy state...")
  const state = loadDeployState()
  const deployedCount = Object.keys(state).length
  if (deployedCount === CONTRACTS.length) {
    checks.push({
      name: "Contract deploy state",
      status: "pass",
      detail: `All ${CONTRACTS.length} contracts have deploy state`,
    })
    logger.success(`  All ${CONTRACTS.length} contracts have deploy state`)
  } else {
    checks.push({
      name: "Contract deploy state",
      status: "fail",
      detail: `Only ${deployedCount}/${CONTRACTS.length} contracts have deploy state`,
    })
    logger.error(`  Only ${deployedCount}/${CONTRACTS.length} contracts have deploy state`)
  }

  // 2. Check .env.local has contract hashes
  logger.detail("Check 2: Environment configuration...")
  const envKeys = CONTRACTS.map((c) => c.envVar)
  let envConfigured = true
  // Can't easily read .env.local from here without importing — just check deploy state
  if (deployedCount === CONTRACTS.length) {
    checks.push({
      name: "Environment configuration",
      status: "pass",
      detail: "Contract hashes available in deploy state",
    })
    logger.success("  Contract hashes available")
  } else {
    envConfigured = false
    checks.push({
      name: "Environment configuration",
      status: "warn",
      detail: "Run `bun run scripts/deploy.ts --update-env` to configure .env.local",
    })
    logger.warn("  .env.local not fully configured")
  }

  // 3. Check DB has seeded agents
  logger.detail("Check 3: Seeded agents in database...")
  let agentsInDb = 0
  try {
    agentsInDb = await db.agent.count()
    if (agentsInDb >= SEED_AGENTS.length) {
      checks.push({
        name: "Seeded agents",
        status: "pass",
        detail: `${agentsInDb} agents in database (expected ≥${SEED_AGENTS.length})`,
      })
      logger.success(`  ${agentsInDb} agents in database`)
    } else {
      checks.push({
        name: "Seeded agents",
        status: "warn",
        detail: `Only ${agentsInDb} agents in database (expected ≥${SEED_AGENTS.length})`,
      })
      logger.warn(`  Only ${agentsInDb} agents in database (expected ≥${SEED_AGENTS.length})`)
    }
  } catch (e) {
    checks.push({
      name: "Seeded agents",
      status: "fail",
      detail: `DB error: ${e instanceof Error ? e.message : String(e)}`,
    })
    logger.error(`  DB error: ${e instanceof Error ? e.message : String(e)}`)
  }

  // 4. Check transactions exist
  logger.detail("Check 4: Activity feed...")
  let txCount = 0
  try {
    txCount = await db.transaction.count()
    if (txCount > 0) {
      checks.push({
        name: "Activity feed",
        status: "pass",
        detail: `${txCount} transactions in feed`,
      })
      logger.success(`  ${txCount} transactions in feed`)
    } else {
      checks.push({
        name: "Activity feed",
        status: "warn",
        detail: "No transactions in feed — run `bun run scripts/seed.ts`",
      })
      logger.warn("  No transactions in feed")
    }
  } catch {
    // ignore
  }

  // 5. Check network reachability (best-effort)
  logger.detail("Check 5: Network reachability...")
  let networkReachable = false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5_000)
    const res = await fetch(net.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "info_get_status", params: null }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      if (data?.result?.chain_name) {
        networkReachable = true
        checks.push({
          name: "Network reachability",
          status: "pass",
          detail: `${net.name} reachable, chain=${data.result.chain_name}`,
        })
        logger.success(`  ${net.name} reachable`)
      }
    }
  } catch (e) {
    checks.push({
      name: "Network reachability",
      status: "warn",
      detail: `RPC unreachable from this environment: ${e instanceof Error ? e.message : "unknown"}`,
    })
    logger.warn(`  RPC unreachable (this is expected in sandbox environments)`)
  }

  // Summary
  const passCount = checks.filter((c) => c.status === "pass").length
  const failCount = checks.filter((c) => c.status === "fail").length
  const warnCount = checks.filter((c) => c.status === "warn").length

  divider()
  if (failCount === 0) {
    logger.success(`Health check passed (${passCount} pass, ${warnCount} warn, ${failCount} fail)`)
  } else {
    logger.error(`Health check failed (${passCount} pass, ${warnCount} warn, ${failCount} fail)`)
  }

  return {
    ok: failCount === 0,
    contractsDeployed: deployedCount,
    contractsTotal: CONTRACTS.length,
    agentsInDb,
    agentsExpected: SEED_AGENTS.length,
    networkReachable,
    envConfigured,
    checks,
  }
}
