#!/usr/bin/env bun
/**
 * SKYWEE — Master deployment script.
 *
 * One-command deployment for hackathon submission:
 *   1. Compile & deploy 5 Odra contracts to Casper Testnet/Mainnet
 *   2. Seed 8 initial SKYWEE agents (on-chain + DB)
 *   3. Authorize monitors/verifiers/swarm agents
 *   4. Update .env.local with contract hashes + RPC config
 *   5. Run health check
 *
 * Usage:
 *   bun run scripts/deploy.ts --network testnet --key ~/.casper/testnet/secret_key.pem
 *   bun run scripts/deploy.ts --network testnet --dry-run
 *   bun run scripts/deploy.ts --health-only
 *   bun run scripts/deploy.ts --seed-only --network testnet
 *
 * Prerequisites (for real deploy):
 *   - Rust + cargo: https://rustup.rs
 *   - Odra CLI: cargo install odra-cli
 *   - Casper Wallet key file (.pem)
 *   - CSPR balance on deployer account (testnet: get from faucet)
 *
 * In dry-run mode, the script simulates the full flow without sending
 * transactions — useful for testing the deployment logic.
 */

import { parseArgs } from "util"
import { deployContracts, loadDeployState, type DeployOptions } from "./contract-deployer"
import { seedSkywee } from "./agent-seeder"
import { updateEnvFile, printEnvConfig } from "./env-updater"
import { healthCheck } from "./health-check"
import { banner, logger, divider } from "./deploy-logger"
import { CONTRACTS, NETWORKS } from "./deploy-config"

// =========================================================================
// CLI argument parsing
// =========================================================================

const { values: args } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    network: { type: "string", default: "testnet" },
    key: { type: "string", default: "~/.casper/testnet/secret_key.pem" },
    "dry-run": { type: "boolean", default: false },
    "skip-build": { type: "boolean", default: false },
    "health-only": { type: "boolean", default: false },
    "seed-only": { type: "boolean", default: false },
    "env-only": { type: "boolean", default: false },
    "cspr-cloud-key": { type: "string" },
    "mcp-url": { type: "string" },
    help: { type: "boolean", default: false },
  },
  strict: true,
  allowPositionals: false,
})

function showHelp() {
  console.log(`
SKYWEE — Master Deployment Script

Usage:
  bun run scripts/deploy.ts [options]

Options:
  --network <name>         Casper network: testnet (default) or mainnet
  --key <path>             Path to Casper Wallet secret key .pem file
                           Default: ~/.casper/testnet/secret_key.pem
  --dry-run                Simulate deployment without sending transactions
  --skip-build             Skip cargo build (use existing build)
  --health-only            Only run health check, skip deploy & seed
  --seed-only              Only seed agents, skip contract deployment
  --env-only               Only update .env.local from existing deploy state
  --cspr-cloud-key <key>   CSPR.cloud API key (written to .env.local)
  --mcp-url <url>          Casper MCP server URL (written to .env.local)
  --help                   Show this help

Examples:
  # Full dry-run (test deployment logic without gas)
  bun run scripts/deploy.ts --dry-run

  # Full real deploy to testnet
  bun run scripts/deploy.ts --network testnet --key ~/.casper/testnet/secret_key.pem

  # Seed only (after contracts already deployed)
  bun run scripts/deploy.ts --seed-only --network testnet

  # Health check only
  bun run scripts/deploy.ts --health-only --network testnet

  # Update .env.local from existing deploy state
  bun run scripts/deploy.ts --env-only --network testnet

Prerequisites (for real deploy):
  - Rust:        https://rustup.rs
  - Odra CLI:    cargo install odra-cli
  - Casper key:  generate with 'casper-client keygen' or import from wallet
  - Testnet CSPR: get from faucet at https://testnet.cspr.live/faucet
`)
}

// =========================================================================
// Main
// =========================================================================

async function main() {
  if (args.help) {
    showHelp()
    process.exit(0)
  }

  const network = args.network as "testnet" | "mainnet"
  if (!NETWORKS[network]) {
    logger.error(`Unknown network: ${network}`)
    logger.error("Must be 'testnet' or 'mainnet'")
    process.exit(1)
  }

  banner("SKYWEE — Master Deployment")

  // ----- Health-only mode -----
  if (args["health-only"]) {
    logger.info("Health-only mode")
    const result = await healthCheck(network)
    process.exit(result.ok ? 0 : 1)
  }

  // ----- Env-only mode -----
  if (args["env-only"]) {
    logger.info("Env-only mode — updating .env.local from deploy state")
    const state = loadDeployState()
    const contractHashes: Record<string, string | null> = {}
    for (const spec of CONTRACTS) {
      contractHashes[spec.module] = state[spec.module]?.hash ?? null
    }
    updateEnvFile({
      network,
      contractHashes,
      deployerPublicKey: null,
      csprCloudApiKey: args["cspr-cloud-key"],
      mcpServerUrl: args["mcp-url"],
    })
    printEnvConfig()
    process.exit(0)
  }

  // ----- Seed-only mode -----
  if (args["seed-only"]) {
    logger.info("Seed-only mode")
    const state = loadDeployState()
    const contractHashes: Record<string, string | null> = {}
    for (const spec of CONTRACTS) {
      contractHashes[spec.module] = state[spec.module]?.hash ?? null
    }
    const seedResult = await seedSkywee({
      contractHashes,
      deployerPublicKey: null,
      dryRun: args["dry-run"],
    })
    if (!seedResult.success) {
      process.exit(1)
    }
    process.exit(0)
  }

  // ----- Full deploy flow -----

  // Step 1: Deploy contracts
  banner("Step 1 / 4 — Deploy Contracts")

  const deployOpts: DeployOptions = {
    network,
    keyPath: args.key!,
    dryRun: args["dry-run"],
    skipBuild: args["skip-build"],
  }

  const deployResult = await deployContracts(deployOpts)

  // Build contract hash map
  const contractHashes: Record<string, string | null> = {}
  for (const c of deployResult.contracts) {
    contractHashes[c.spec.module] = c.hash
  }

  if (!deployResult.success && !args["dry-run"]) {
    logger.error("Contract deployment failed — aborting")
    logger.error("You can retry with --seed-only after fixing the deploy issue")
    process.exit(1)
  }

  // Step 2: Seed agents
  banner("Step 2 / 4 — Seed Initial Agents")

  const seedResult = await seedSkywee({
    contractHashes,
    deployerPublicKey: deployResult.deployerPublicKey,
    dryRun: args["dry-run"],
  })

  // Step 3: Update .env.local
  banner("Step 3 / 4 — Update Environment Configuration")

  if (!args["dry-run"] || deployResult.success) {
    updateEnvFile({
      network,
      contractHashes,
      deployerPublicKey: deployResult.deployerPublicKey,
      csprCloudApiKey: args["cspr-cloud-key"],
      mcpServerUrl: args["mcp-url"],
    })
    printEnvConfig()
  } else {
    logger.dim("[dry-run] skipping .env.local update")
  }

  // Step 4: Health check
  banner("Step 4 / 4 — Health Check")

  const healthResult = await healthCheck(network)

  // Summary
  banner("Deployment Summary")

  logger.info(`Network:        ${network} (${NETWORKS[network].name})`)
  logger.info(`Dry run:        ${args["dry-run"] ? "yes" : "no"}`)
  logger.info(`Duration:       ${((deployResult.duration + seedResult.duration) / 1000).toFixed(2)}s`)
  divider()

  logger.info("Contracts deployed:")
  for (const c of deployResult.contracts) {
    const status = c.hash ? "✓" : "✗"
    const hash = c.hash ?? "(failed)"
    logger.detail(`  ${status} ${c.spec.name.padEnd(20)} → ${hash}`)
  }
  divider()

  logger.info("Agents seeded:")
  logger.detail(`  ${seedResult.agentsRegistered} agents registered`)
  logger.detail(`  ${seedResult.monitorsAuthorized} monitors authorized (Aegis)`)
  logger.detail(`  ${seedResult.verifiersAuthorized} verifiers authorized (CarbonGuard)`)
  logger.detail(`  ${seedResult.swarmAgentsAdded} swarm agents added (SwarmTreasury)`)
  if (seedResult.errors.length > 0) {
    logger.warn(`  ${seedResult.errors.length} error(s) during seeding`)
    seedResult.errors.forEach((e) => logger.detail(`    - ${e}`))
  }
  divider()

  logger.info("Health check:")
  for (const check of healthResult.checks) {
    const icon = check.status === "pass" ? "✓" : check.status === "warn" ? "⚠" : "✗"
    logger.detail(`  ${icon} ${check.name}: ${check.detail}`)
  }
  divider()

  if (healthResult.ok) {
    logger.success("🎉 SKYWEE deployment complete!")
    logger.info("")
    logger.info("Next steps:")
    logger.detail("  1. Restart your dev server: bun run dev")
    logger.detail("  2. Open http://localhost:3000")
    logger.detail("  3. Connect your Casper Wallet")
    logger.detail("  4. Verify agents are visible in AgentSquare")
    logger.detail("  5. Try deploying a new agent via the modal")
  } else {
    logger.warn("Deployment completed with issues — see health check above")
    process.exit(1)
  }
}

main().catch((e) => {
  logger.error("Fatal error:", e)
  process.exit(1)
})
