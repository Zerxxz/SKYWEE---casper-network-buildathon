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
  // Don't use `which` — it can't handle subcommands like "cargo odra --version".
  // Instead, run the command directly and check exit code.
  const result = run(`${cmd} 2>/dev/null`)
  return result.success
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
    if (!checkCommand("cargo --version")) {
      errors.push("cargo not found — install Rust: https://rustup.rs")
    }
    if (!checkCommand("cargo odra --version")) {
      errors.push("cargo-odra not found — install: cargo install cargo-odra")
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
  logger.step("Building Odra contracts to WASM (cargo odra build)...")
  const result = run("cargo odra build", { cwd: CONTRACTS_DIR })
  if (!result.success) {
    logger.error("Build failed:")
    console.error(result.stderr)
    return false
  }
  // Verify all 5 WASM files exist
  const wasmDir = join(CONTRACTS_DIR, "wasm")
  const expected = ["AgentRegistry.wasm", "InsuranceContract.wasm", "TreasuryContract.wasm", "RwaVault.wasm", "CarbonGuard.wasm"]
  const missing = expected.filter(f => !existsSync(join(wasmDir, f)))
  if (missing.length > 0) {
    logger.error(`Build incomplete — missing WASM files: ${missing.join(", ")}`)
    return false
  }
  logger.success(`WASM build successful (5 contracts in ${wasmDir})`)

  // Post-build optimization: strip bulk-memory opcodes so Casper's wasm
  // preprocessor accepts the modules. Casper's wasmi-0.x validator rejects
  // any module containing memory.copy / memory.fill / data count section.
  // See: https://github.com/casper-network/casper-node/issues/4367
  logger.step("Optimizing WASM for Casper (lowering bulk-memory ops)...")
  const opt = run("bash scripts/optimize-wasm.sh", { cwd: CONTRACTS_DIR })
  if (!opt.success) {
    logger.error("WASM optimization failed:")
    console.error(opt.stderr)
    return false
  }
  logger.success("WASM optimized — no bulk-memory operations remain")
  return true
}

// =========================================================================
// Deploy ALL contracts via livenet (single run)
// =========================================================================

function deployAllLivenet(opts: DeployOptions): { success: boolean; output: string; error?: string } {
  const network = NETWORKS[opts.network]
  const keyPath = expandPath(opts.keyPath)

  if (opts.dryRun) {
    logger.dim("[dry-run] would run: cargo run --bin deploy_skywee --features livenet")
    return { success: true, output: "" }
  }

  // cargo-odra 0.1.7 has no `livenet` subcommand. We use our custom
  // `deploy.rs` binary that depends on `odra-casper-livenet-env` directly.
  // The binary reads env vars: ODRA_CASPER_LIVENET_SECRET_KEY_PATH,
  // ODRA_CASPER_LIVENET_NODE_ADDRESS, ODRA_CASPER_LIVENET_CHAIN_NAME,
  // ODRA_CASPER_LIVENET_EVENTS_URL (SSE event stream URL).
  const env = {
    ...process.env,
    ODRA_CASPER_LIVENET_SECRET_KEY_PATH: keyPath,
    ODRA_CASPER_LIVENET_NODE_ADDRESS: network.rpcUrl,
    ODRA_CASPER_LIVENET_CHAIN_NAME: network.chainName,
    ODRA_CASPER_LIVENET_EVENTS_URL: network.eventsUrl,
  }

  logger.step("Deploying all contracts via livenet (cargo run --bin deploy_skywee --features livenet)...")

  const result = spawnSync("cargo run --bin deploy_skywee --features livenet --release", {
    cwd: CONTRACTS_DIR,
    shell: true,
    encoding: "utf-8",
    env,
    stdio: ["pipe", "pipe", "pipe"],
  })

  const output = (result.stdout ?? "") + (result.stderr ?? "")

  return {
    success: result.status === 0,
    output,
    error: result.status === 0 ? undefined : output,
  }
}

// Parse livenet output for contract hashes
// Pattern: ^<Name>\s*:\s*(hash-[0-9a-f]+)$  OR  ^<Name>  :  hash-...
function parseLivenetOutput(output: string): Record<string, string> {
  const hashes: Record<string, string> = {}
  const lines = output.split("\n")
  for (const line of lines) {
    // Match lines like "AgentRegistry  : hash-abc123..."
    const match = line.match(/^(\w+)\s*:.*?(hash-[0-9a-f]{64})/i)
    if (match) {
      hashes[match[1]] = match[2]
    }
    // Also match "hash-..." with preceding name containing letters
    const match2 = line.match(/^(AgentRegistry|Insurance|InsuranceContract|Treasury|TreasuryContract|RwaVault|CarbonGuard)\b.*?(hash-[0-9a-f]{64})/i)
    if (match2) {
      const name = match2[1].toLowerCase().includes("insurance") ? "InsuranceContract"
        : match2[1].toLowerCase().includes("treasury") ? "TreasuryContract"
        : match2[1]
      hashes[name] = match2[2]
    }
  }
  return hashes
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
    logger.dim("[dry-run] skipping cargo odra build")
  }

  // Save deploy state
  mkdirSync(DEPLOY_STATE_DIR, { recursive: true })

  // Deploy ALL contracts in a single livenet run
  const results: DeployResult["contracts"] = []

  if (opts.dryRun) {
    // Dry-run: simulate hashes for all 5 contracts
    for (const spec of CONTRACTS) {
      const fakeHash = `hash-${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`
      const fakeDeployHash = `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`
      results.push({ spec, hash: fakeHash, deployHash: fakeDeployHash })
      logger.dim(`  [dry-run] ${spec.name} → ${fakeHash}`)
    }
  } else {
    const deployResult = deployAllLivenet(opts)
    if (!deployResult.success) {
      logger.error("Livenet deployment failed:")
      console.error(deployResult.error)
      return {
        success: false,
        contracts: CONTRACTS.map(spec => ({ spec, hash: null, deployHash: null, error: deployResult.error })),
        networkName: network.name,
        rpcUrl: network.rpcUrl,
        deployerPublicKey: null,
        duration: Date.now() - start,
      }
    }

    // Parse contract hashes from livenet output
    const hashes = parseLivenetOutput(deployResult.output)
    for (const spec of CONTRACTS) {
      const altKey = Object.keys(hashes).find(k => k.toLowerCase().includes(spec.name.toLowerCase().replace("contract", "")))
      const hash = hashes[spec.name] || (altKey ? hashes[altKey] : null) || null
      if (hash) {
        logger.success(`  ${spec.name} → ${hash}`)
      } else {
        logger.warn(`  ${spec.name} → hash not found in output`)
      }
      results.push({ spec, hash, deployHash: null })
    }
  }

  // Save state for each contract
  for (const r of results) {
    if (r.hash) {
      const stateFile = join(DEPLOY_STATE_DIR, `${r.spec.module}.json`)
      writeFileSync(stateFile, JSON.stringify({
        module: r.spec.module,
        name: r.spec.name,
        hash: r.hash,
        deployHash: r.deployHash,
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
