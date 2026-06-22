/**
 * SKYWEE contract deployer.
 *
 * Wraps the Odra CLI to compile and deploy the 5 SKYWEE contracts to
 * Casper Testnet / Mainnet. In dry-run mode, simulates the deploy
 * without sending transactions.
 *
 * Prerequisites:
 *   - Rust + cargo installed
 *   - Odra CLI installed: cargo install odra-cli
 *   - Casper Wallet key file at the path passed to --key
 *
 * Usage:
 *   const result = await deployContracts({
 *     network: "testnet",
 *     keyPath: "~/.casper/testnet/secret_key.pem",
 *     dryRun: false,
 *   })
 */

import { execSync, spawnSync } from "child_process"
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs"
import { homedir } from "os"
import { join, resolve } from "path"
import { CONTRACTS, NETWORKS, type ContractSpec } from "./deploy-config"
import { logger, divider } from "./deploy-logger"

export interface DeployResult {
  success: boolean
  contracts: Array<{
    spec: ContractSpec
    hash: string | null
    deployHash: string | null
    error?: string
  }>
  networkName: string
  rpcUrl: string
  deployerPublicKey: string | null
  duration: number
}

export interface DeployOptions {
  network: "testnet" | "mainnet"
  keyPath: string
  dryRun?: boolean
  /** Skip cargo build if already built */
  skipBuild?: boolean
}

const CONTRACTS_DIR = resolve(process.cwd(), "contracts/odra")
const DEPLOY_STATE_DIR = resolve(process.cwd(), ".skywee-deploy")

// =========================================================================
// Helpers
// =========================================================================

function expandPath(p: string): string {
  if (p.startsWith("~")) return join(homedir(), p.slice(1))
  return resolve(p)
}

function run(cmd: string, opts: { cwd?: string; dryRun?: boolean } = {}): { success: boolean; stdout: string; stderr: string } {
  if (opts.dryRun) {
    logger.dim(`[dry-run] would run: ${cmd}`)
    return { success: true, stdout: "", stderr: "" }
  }
  try {
    const result = spawnSync(cmd, {
      cwd: opts.cwd ?? process.cwd(),
      shell: true,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    return {
      success: result.status === 0,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    }
  } catch (e) {
    return {
      success: false,
      stdout: "",
      stderr: e instanceof Error ? e.message : String(e),
    }
  }
}

function checkCommand(cmd: string): boolean {
  const result = run(`which ${cmd}`)
  return result.success && result.stdout.trim().length > 0
}

function extractContractHash(output: string): string | null {
  // Odra CLI typically prints something like:
  //   Contract deployed at: hash-abc123...
  // or:
  //   Contract hash: hash-abc123...
  const patterns = [
    /Contract deployed at:\s*(hash-[a-f0-9]+)/i,
    /Contract hash:\s*(hash-[a-f0-9]+)/i,
    /contract_hash[":\s]+(hash-[a-f0-9]+)/i,
    /"hash":\s*"(hash-[a-f0-9]+)"/i,
    /\b(hash-[a-f0-9]{64})\b/i,
  ]
  for (const pattern of patterns) {
    const match = output.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractDeployHash(output: string): string | null {
  const patterns = [
    /Deploy hash:\s*(0x[a-f0-9]+)/i,
    /deploy_hash[":\s]+(0x[a-f0-9]+)/i,
    /\b(0x[a-f0-9]{64})\b/i,
  ]
  for (const pattern of patterns) {
    const match = output.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractPublicKey(keyPath: string): string | null {
  // Try to extract public key from the secret key file
  // Casper secret key files are PEM-encoded and contain the public key
  // in their subject or in a separate .pub file
  try {
    const pubPath = keyPath.replace(/\.pem$/, ".pub.pem")
    if (existsSync(pubPath)) {
      const content = readFileSync(pubPath, "utf-8")
      // Extract hex from PEM
      const match = content.match(/02[a-f0-9]{64}/i)
      if (match) return match[0]
    }
  } catch {
    // ignore
  }
  return null
}

// =========================================================================
// Pre-flight checks
// =========================================================================

function preflight(opts: DeployOptions): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  // Check contracts directory
  if (!existsSync(CONTRACTS_DIR)) {
    errors.push(`Contracts directory not found: ${CONTRACTS_DIR}`)
  } else if (!existsSync(join(CONTRACTS_DIR, "Cargo.toml"))) {
    errors.push(`Cargo.toml not found in: ${CONTRACTS_DIR}`)
  }

  // Check key file (skip in dry-run)
  if (!opts.dryRun) {
    const keyPath = expandPath(opts.keyPath)
    if (!existsSync(keyPath)) {
      errors.push(`Key file not found: ${keyPath}`)
    }
  }

  // Check tooling (skip in dry-run)
  if (!opts.dryRun) {
    if (!checkCommand("cargo")) {
      errors.push("cargo not found — install Rust: https://rustup.rs")
    }
    if (!checkCommand("odra")) {
      errors.push("odra CLI not found — install: cargo install odra-cli")
    }
  }

  // Check network config
  if (!NETWORKS[opts.network]) {
    errors.push(`Unknown network: ${opts.network} (must be 'testnet' or 'mainnet')`)
  }

  return { ok: errors.length === 0, errors }
}

// =========================================================================
// Build step
// =========================================================================

function buildContracts(): boolean {
  logger.step("Building contracts with cargo...")
  const result = run("cargo build --release", { cwd: CONTRACTS_DIR })
  if (!result.success) {
    logger.error("Build failed:")
    console.error(result.stderr)
    return false
  }
  logger.success("Build successful")
  return true
}

// =========================================================================
// Deploy a single contract
// =========================================================================

function deployOne(spec: ContractSpec, opts: DeployOptions): { hash: string | null; deployHash: string | null; error?: string } {
  const network = NETWORKS[opts.network]
  const keyPath = expandPath(opts.keyPath)

  logger.step(`Deploying ${spec.name} (${spec.description})...`)

  // Odra CLI command:
  // odra deploy -c <contract_name> -k <key_path> -n <network> --rpc <rpc_url>
  const cmd = `odra deploy -c ${spec.name} -k ${keyPath} -n ${opts.network} --rpc ${network.rpcUrl} --chain-name ${network.chainName}`

  const result = run(cmd, { cwd: CONTRACTS_DIR, dryRun: opts.dryRun })

  if (!result.success && !opts.dryRun) {
    return {
      hash: null,
      deployHash: null,
      error: result.stderr || "Deploy failed",
    }
  }

  const hash = opts.dryRun
    ? `hash-${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`
    : extractContractHash(result.stdout + result.stderr)
  const deployHash = opts.dryRun
    ? `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`
    : extractDeployHash(result.stdout + result.stderr)

  if (!hash && !opts.dryRun) {
    return {
      hash: null,
      deployHash,
      error: "Could not extract contract hash from output",
    }
  }

  logger.success(`  ${spec.name} → ${hash}`)
  return { hash, deployHash }
}

// =========================================================================
// Main deploy function
// =========================================================================

export async function deployContracts(opts: DeployOptions): Promise<DeployResult> {
  const start = Date.now()
  const network = NETWORKS[opts.network]

  divider()
  logger.info(`Network: ${opts.network} (${network.name})`)
  logger.info(`RPC URL: ${network.rpcUrl}`)
  logger.info(`Key: ${expandPath(opts.keyPath)}`)
  logger.info(`Dry run: ${opts.dryRun ? "yes" : "no"}`)
  divider()

  // Preflight
  logger.step("Running pre-flight checks...")
  const pre = preflight(opts)
  if (!pre.ok) {
    logger.error("Pre-flight checks failed:")
    pre.errors.forEach((e) => logger.error(`  ${e}`))
    return {
      success: false,
      contracts: [],
      networkName: network.name,
      rpcUrl: network.rpcUrl,
      deployerPublicKey: null,
      duration: Date.now() - start,
    }
  }
  logger.success("Pre-flight checks passed")

  // Build
  if (!opts.skipBuild && !opts.dryRun) {
    if (!buildContracts()) {
      return {
        success: false,
        contracts: [],
        networkName: network.name,
        rpcUrl: network.rpcUrl,
        deployerPublicKey: null,
        duration: Date.now() - start,
      }
    }
  } else if (opts.dryRun) {
    logger.dim("[dry-run] skipping cargo build")
  }

  // Save deploy state
  mkdirSync(DEPLOY_STATE_DIR, { recursive: true })

  // Deploy each contract
  const results: DeployResult["contracts"] = []
  for (const spec of CONTRACTS) {
    const result = deployOne(spec, opts)
    results.push({ spec, ...result })

    if (!result.hash && !opts.dryRun) {
      logger.error(`Failed to deploy ${spec.name}: ${result.error}`)
      // Continue with other contracts — partial deploy is OK, we'll
      // report what succeeded
    }

    // Save state after each contract
    if (result.hash) {
      const stateFile = join(DEPLOY_STATE_DIR, `${spec.module}.json`)
      writeFileSync(stateFile, JSON.stringify({
        module: spec.module,
        name: spec.name,
        hash: result.hash,
        deployHash: result.deployHash,
        deployedAt: new Date().toISOString(),
        network: opts.network,
      }, null, 2))
    }
  }

  const success = results.every((r) => r.hash !== null)
  const deployerPublicKey = opts.dryRun ? null : extractPublicKey(expandPath(opts.keyPath))

  if (success) {
    logger.success("All contracts deployed successfully")
  } else {
    logger.warn("Some contracts failed to deploy — see errors above")
  }

  return {
    success,
    contracts: results,
    networkName: network.name,
    rpcUrl: network.rpcUrl,
    deployerPublicKey,
    duration: Date.now() - start,
  }
}

// =========================================================================
// State persistence
// =========================================================================

export function loadDeployState(): Record<string, { hash: string; deployHash: string | null; deployedAt: string }> {
  const state: Record<string, { hash: string; deployHash: string | null; deployedAt: string }> = {}
  if (!existsSync(DEPLOY_STATE_DIR)) return state
  for (const spec of CONTRACTS) {
    const stateFile = join(DEPLOY_STATE_DIR, `${spec.module}.json`)
    if (existsSync(stateFile)) {
      try {
        const data = JSON.parse(readFileSync(stateFile, "utf-8"))
        state[spec.module] = {
          hash: data.hash,
          deployHash: data.deployHash,
          deployedAt: data.deployedAt,
        }
      } catch {
        // ignore
      }
    }
  }
  return state
}

export function getDeployStateDir(): string {
  return DEPLOY_STATE_DIR
}
