/**
 * SKYWEE .env.local updater.
 *
 * After contracts are deployed, writes the contract hashes + RPC config
 * to .env.local so the Next.js app can use them for real on-chain calls.
 */

import { existsSync, readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { CONTRACTS, NETWORKS } from "./deploy-config"
import { logger } from "./deploy-logger"

const ENV_FILE = resolve(process.cwd(), ".env.local")
const ENV_FILE_DEFAULT = resolve(process.cwd(), ".env")

export interface EnvUpdateOptions {
  network: "testnet" | "mainnet"
  contractHashes: Record<string, string | null>
  deployerPublicKey: string | null
  /** Optional CSPR.cloud API key */
  csprCloudApiKey?: string
  /** Optional Casper MCP server URL */
  mcpServerUrl?: string
}

/**
 * Parse an env file into key-value pairs, preserving comments and order.
 */
function parseEnvFile(path: string): { lines: string[]; values: Record<string, string> } {
  if (!existsSync(path)) return { lines: [], values: {} }
  const content = readFileSync(path, "utf-8")
  const lines = content.split("\n")
  const values: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIndex = trimmed.indexOf("=")
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "")
    values[key] = value
  }
  return { lines, values }
}

/**
 * Update or insert a key in the env lines array.
 */
function upsertEnvLine(lines: string[], key: string, value: string): string[] {
  const newLine = `${key}=${value}`
  const idx = lines.findIndex((l) => {
    const t = l.trim()
    return t.startsWith(`${key}=`) || t === key
  })
  if (idx >= 0) {
    const result = [...lines]
    result[idx] = newLine
    return result
  }
  return [...lines, newLine]
}

/**
 * Update .env.local with deploy results.
 */
export function updateEnvFile(opts: EnvUpdateOptions): { updated: string[]; file: string } {
  const network = NETWORKS[opts.network]
  const targetFile = existsSync(ENV_FILE) ? ENV_FILE : ENV_FILE_DEFAULT

  const { lines, values } = parseEnvFile(targetFile)
  let updated: string[] = []
  let workingLines = [...lines]

  // Helper to update + log
  const set = (key: string, value: string) => {
    if (values[key] !== value) {
      workingLines = upsertEnvLine(workingLines, key, value)
      updated.push(key)
    }
  }

  // Network config
  set("CASPER_NETWORK", opts.network)
  set("CASPER_RPC_URL", network.rpcUrl)
  set("CASPER_NETWORK_NAME", network.name)
  set("CASPER_CHAIN_NAME", network.chainName)

  // Contract hashes
  for (const spec of CONTRACTS) {
    const hash = opts.contractHashes[spec.module]
    if (hash) {
      set(spec.envVar, hash)
    }
  }

  // CSPR.cloud API key
  if (opts.csprCloudApiKey) {
    set("CSPR_CLOUD_API_KEY", opts.csprCloudApiKey)
  }

  // MCP server URL
  if (opts.mcpServerUrl) {
    set("CASPER_MCP_SERVER_URL", opts.mcpServerUrl)
  }

  // Deployer public key (for reference)
  if (opts.deployerPublicKey) {
    set("SKYWEE_DEPLOYER_PUBLIC_KEY", opts.deployerPublicKey)
  }

  // Write back
  const content = workingLines.join("\n")
  writeFileSync(targetFile, content + (content.endsWith("\n") ? "" : "\n"))

  logger.success(`Updated ${targetFile}`)
  if (updated.length > 0) {
    logger.detail(`  Updated ${updated.length} key(s): ${updated.join(", ")}`)
  } else {
    logger.detail("  No changes needed")
  }

  return { updated, file: targetFile }
}

/**
 * Print the current env config for verification.
 */
export function printEnvConfig(): void {
  const targetFile = existsSync(ENV_FILE) ? ENV_FILE : ENV_FILE_DEFAULT
  const { values } = parseEnvFile(targetFile)

  logger.info("Current SKYWEE configuration:")
  const keys = [
    "CASPER_NETWORK",
    "CASPER_RPC_URL",
    "CASPER_NETWORK_NAME",
    "CONTRACT_AGENT_REGISTRY",
    "CONTRACT_INSURANCE",
    "CONTRACT_TREASURY",
    "CONTRACT_RWA_VAULT",
    "CONTRACT_CARBON_GUARD",
    "CSPR_CLOUD_API_KEY",
    "CASPER_MCP_SERVER_URL",
  ]
  for (const key of keys) {
    const value = values[key]
    if (value) {
      const display = value.length > 50 ? `${value.slice(0, 50)}…` : value
      logger.detail(`  ${key}=${display}`)
    } else {
      logger.dim(`  ${key}=<not set>`)
    }
  }
}
