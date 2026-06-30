/**
 * SKYWEE — Real Casper deploy construction & broadcasting.
 *
 * This module provides utilities for building, signing, and broadcasting
 * real Casper deploys via the casper-js-sdk. The signing is done by the
 * Casper Wallet browser extension via `window.casperWalletProvider.signDeploy()`.
 *
 * Flow (when real wallet connected):
 *   1. Build an unsigned Deploy on the client (this module)
 *   2. Pass to wallet extension for signing → returns signed Deploy
 *   3. POST signed Deploy to /api/skywee/deploys/broadcast
 *   4. API route forwards to Casper RPC node via casper-js-sdk RpcClient
 *   5. Returns deploy hash → UI polls /api/skywee/deploys/[hash] for status
 *
 * In demo mode (no wallet extension), we fall back to the DB-simulation
 * flow that's already in place.
 *
 * Environment variables:
 *   CASPER_RPC_URL          e.g. http://rpc.testnet.casper.network:7777/rpc
 *   CASPER_NETWORK_NAME     e.g. casper-test
 *   CASPER_CHAIN_NAME       e.g. casper-test  (legacy name)
 *   CONTRACT_AGENT_REGISTRY  hash of deployed AgentRegistry contract
 *   CONTRACT_INSURANCE       hash of deployed InsuranceContract
 *   CONTRACT_TREASURY        hash of deployed TreasuryContract
 *   CONTRACT_RWA_VAULT       hash of deployed RwaVault
 *   CONTRACT_CARBON_GUARD    hash of deployed CarbonGuard
 *
 * If contracts aren't deployed yet, calls fall back to simulation mode.
 */

import {
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  Args,
  CLValue,
  DEFAULT_DEPLOY_TTL,
  PublicKey,
  U512,
} from "casper-js-sdk"

// =========================================================================
// Types
// =========================================================================

export interface DeployParams {
  /** Caller's public key hex (starts with 01/02 for ed25519/secp256k1) */
  publicKey: string
  /** Payment in motes (1 CSPR = 1e9 motes). Default: 1 CSPR */
  paymentMotes?: string
  /** TTL in ms. Default: 30min */
  ttlMs?: number
  /** Chain name (network name). Default: from env or 'casper-test' */
  chainName?: string
}

export type SessionBuilder = (
  deployParams: DeployParams,
) => ExecutableDeployItem

export interface BuildDeployResult {
  deploy: Deploy
  deployJson: unknown // serializable form for the wallet extension
}

export interface SignedDeployResult {
  success: boolean
  deployHash?: string
  signedDeployJson?: unknown
  error?: string
  /** If true, the user is in demo mode and the API should fall back to simulation */
  fallbackToSimulation?: boolean
}

// =========================================================================
// Environment helpers
// =========================================================================

const RPC_URL = process.env.CASPER_RPC_URL ?? "https://rpc.testnet.casper.network/rpc"
const NETWORK_NAME = process.env.CASPER_NETWORK_NAME ?? process.env.CASPER_CHAIN_NAME ?? "casper-test"

const CONTRACT_HASHES: Record<string, string | undefined> = {
  agent_registry: process.env.CONTRACT_AGENT_REGISTRY,
  insurance: process.env.CONTRACT_INSURANCE,
  treasury: process.env.CONTRACT_TREASURY,
  rwa_vault: process.env.CONTRACT_RWA_VAULT,
  carbon_guard: process.env.CONTRACT_CARBON_GUARD,
}

export function isRealDeployMode(): boolean {
  // Real deploy mode requires: at least one contract hash configured
  // AND the RPC URL set (even if not reachable from this sandbox).
  return Object.values(CONTRACT_HASHES).some((h) => !!h)
}

export function getContractHash(module: string): string | null {
  return CONTRACT_HASHES[module] ?? null
}

// =========================================================================
// Build a Deploy for a contract call (stored session, by contract hash)
// =========================================================================

/**
 * Build an unsigned Deploy that calls an entry point on a stored contract
 * (by contract hash). Returns the Deploy object + its JSON form for the
 * wallet extension's `signDeploy()` method.
 */
export function buildContractCallDeploy(
  params: DeployParams,
  contractHash: string,
  entryPoint: string,
  args: Record<string, unknown>,
): BuildDeployResult {
  const publicKey = PublicKey.fromHex(params.publicKey)

  // Build runtime args
  const runtimeArgs = Args.fromBytes(Uint8Array.from([]))
  for (const [key, value] of Object.entries(args)) {
    runtimeArgs.insert(key, toCLValue(value))
  }

  // Session: stored contract by hash
  const session = ExecutableDeployItem.newModuleBytes(
    new Uint8Array(0), // empty module bytes — using stored contract
    runtimeArgs,
  )

  // Actually for calling a stored contract by hash, we use:
  // ExecutableDeployItem.newStoredContractByHash(contractHashBytes, entryPoint, args)
  const contractHashBytes = hexToBytes(contractHash.replace(/^hash_/, ""))
  const storedSession = ExecutableDeployItem.newStoredContractByHash(
    contractHashBytes,
    entryPoint,
    runtimeArgs,
  )

  // Payment: fixed 1 CSPR (configurable)
  const paymentMotes = params.paymentMotes ?? "1000000000" // 1 CSPR
  const payment = ExecutableDeployItem.newModuleBytes(
    new Uint8Array(0),
    Args.fromBytes(Uint8Array.from([])).insert(
      "amount",
      CLValue.newU256(U512.from(paymentMotes)),
    ),
  )

  const header = new DeployHeader(
    publicKey,
    params.ttlMs ?? DEFAULT_DEPLOY_TTL,
    [], // dependencies
    NETWORK_NAME,
  )

  const deploy = new Deploy(header, payment, storedSession)

  return {
    deploy,
    deployJson: deploy.toJson(),
  }
}

/**
 * Build a simple native CSPR transfer deploy (for x402-style payments).
 */
export function buildTransferDeploy(
  params: DeployParams,
  toPublicKeyHex: string,
  amountMotes: string,
  transferId?: string,
): BuildDeployResult {
  const fromKey = PublicKey.fromHex(params.publicKey)
  const toKey = PublicKey.fromHex(toPublicKeyHex)

  const args = Args.fromBytes(Uint8Array.from([]))
    .insert("amount", CLValue.newU512(U512.from(amountMotes)))
    .insert("target", CLValue.newPublicKey(toKey))
    .insert(
      "id",
      CLValue.newOption(CLValue.newU64(BigInt(transferId ?? "0"))),
    )

  const session = ExecutableDeployItem.newTransfer(args)

  const paymentMotes = params.paymentMotes ?? "1000000000"
  const payment = ExecutableDeployItem.newModuleBytes(
    new Uint8Array(0),
    Args.fromBytes(Uint8Array.from([])).insert(
      "amount",
      CLValue.newU256(U512.from(paymentMotes)),
    ),
  )

  const header = new DeployHeader(
    fromKey,
    params.ttlMs ?? DEFAULT_DEPLOY_TTL,
    [],
    NETWORK_NAME,
  )

  const deploy = new Deploy(header, payment, session)
  return {
    deploy,
    deployJson: deploy.toJson(),
  }
}

// =========================================================================
// Sign deploy via Casper Wallet extension
// =========================================================================

/**
 * Sign a deploy using the Casper Wallet browser extension.
 * Returns the signed deploy JSON or throws if signing fails.
 *
 * Requires `window.casperWalletProvider.signDeploy(deployJson, publicKey)`.
 */
export async function signDeployWithWallet(
  deployJson: unknown,
  publicKey: string,
): Promise<unknown> {
  if (typeof window === "undefined" || !window.casperWalletProvider) {
    throw new Error("Casper Wallet extension not available")
  }

  const result = await window.casperWalletProvider.signDeploy(deployJson, publicKey)

  if (result.cancelled) {
    throw new Error("User cancelled the signing request")
  }

  if (!result.deploy) {
    throw new Error("Wallet did not return a signed deploy")
  }

  return result.deploy
}

// =========================================================================
// Helpers
// =========================================================================

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function toCLValue(value: unknown): CLValue {
  if (typeof value === "string") return CLValue.newString(value as string)
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value >= 0 && value <= 4294967295) return CLValue.newU32(value)
      return CLValue.newU256(U512.from(value.toString()))
    }
    // For floats, encode as string and let the contract parse
    return CLValue.newString(value.toString())
  }
  if (typeof value === "boolean") return CLValue.newBool(value as boolean)
  if (value instanceof U512) return CLValue.newU512(value)
  if (typeof value === "bigint") return CLValue.newU256(U512.from(value.toString()))
  throw new Error(`Unsupported CL value type: ${typeof value}`)
}

// =========================================================================
// Demo mode detection helper (client-side)
// =========================================================================

/**
 * Returns true if the wallet is in demo mode (no real Casper Wallet extension).
 * In demo mode, we skip the real deploy flow entirely and use simulation.
 */
export function isDemoWallet(isDemo: boolean, hasExtension: boolean): boolean {
  return isDemo || !hasExtension
}
