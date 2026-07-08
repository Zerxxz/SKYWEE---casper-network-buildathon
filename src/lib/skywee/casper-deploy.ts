/**
 * SKYWEE — Real Casper deploy construction & broadcasting.
 *
 * This module provides utilities for building, signing, and broadcasting
 * real Casper deploys via casper-js-sdk@5.0.12. Signing is done by the
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
 *   CASPER_RPC_URL          e.g. https://rpc.testnet.casper.network/rpc
 *   CASPER_NETWORK_NAME     e.g. casper-test
 *   CASPER_CHAIN_NAME       e.g. casper-test  (legacy name)
 *   CONTRACT_AGENT_REGISTRY  hash of deployed AgentRegistry contract
 *   CONTRACT_INSURANCE       hash of deployed InsuranceContract
 *   CONTRACT_TREASURY        hash of deployed TreasuryContract
 *   CONTRACT_RWA_VAULT       hash of deployed RwaVault
 *   CONTRACT_CARBON_GUARD    hash of deployed CarbonGuard
 *
 * If contracts aren't deployed yet, calls fall back to simulation mode.
 *
 * NOTE on SDK compatibility: this file targets casper-js-sdk@5.0.12 exactly.
 * Earlier versions used a different API (e.g. `CLValue.newU512`, `Deploy`
 * constructor with 3 args, `Args.fromBytes(...).insert(...)` chaining). All
 * of those have been replaced with the v5 equivalents:
 *   - `CLValue.newU512(x)`        → `CLValue.newCLUInt512(x)`
 *   - `CLValue.newU256(x)`        → `CLValue.newCLUInt256(x)`
 *   - `CLValue.newString(x)`      → `CLValue.newCLString(x)`
 *   - `CLValue.newBool(x)`        → `CLValue.newCLValueBool(x)`
 *   - `CLValue.newOption(x)`      → `CLValue.newCLOption(x)`
 *   - `CLValue.newU64(x)`         → `CLValue.newCLUInt64(x)`
 *   - `CLValue.newU32(x)`         → `CLValue.newCLUInt32(x)`
 *   - `CLValue.newPublicKey(pk)`  → `CLValue.newCLPublicKey(pk)`
 *   - `Args.fromBytes(empty).insert(...)` (chainable, returned Args)
 *                                 → `new Args()` + standalone `.insert(...)` (returns void)
 *   - `new Deploy(header, payment, session)` (3-arg)
 *                                 → `Deploy.makeDeploy(header, payment, session)`
 *   - `new DeployHeader(account, ttl, deps, chainName)` (old order)
 *                                 → `new DeployHeader(chainName, deps, gasPrice, timestamp, ttl, account)`
 *   - `deploy.toJson()`           → `Deploy.toJSON(deploy)`
 *   - `ExecutableDeployItem.newStoredContractByHash(...)` (didn't exist)
 *                                 → `new StoredContractByHash(...)` wrapped in `new ExecutableDeployItem()`
 *   - `ExecutableDeployItem.newTransfer(args)` (didn't exist)
 *                                 → `TransferDeployItem.newTransfer(amount, target, sourcePurse?, id?)` wrapped
 *   - manual payment `newModuleBytes(empty, {amount: U512})`
 *                                 → `ExecutableDeployItem.standardPayment(amount)` (canonical)
 */

import {
  Args,
  CLValue,
  ContractHash,
  Deploy,
  DeployHeader,
  Duration,
  ExecutableDeployItem,
  PublicKey,
  StoredContractByHash,
  Timestamp,
  TransferDeployItem,
} from "casper-js-sdk"

// =========================================================================
// Types
// =========================================================================

export interface DeployParams {
  /** Caller's public key hex (starts with 01/02 for ed25519/secp256k1) */
  publicKey: string
  /** Payment in motes (1 CSPR = 1e9 motes). Default: 3 CSPR. */
  paymentMotes?: string
  /** TTL in ms. Default: 30min. */
  ttlMs?: number
  /** Chain name (network name). Default: from env or 'casper-test'. */
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

// Default TTL: 30 minutes (Casper testnet cap is 1 day).
const DEFAULT_DEPLOY_TTL_MS = 30 * 60 * 1000

// Contract hashes — LIVE on Casper Testnet, verified 2026-07-07.
// These are PUBLIC values (visible on cspr.live explorer).
// Used as fallback when NEXT_PUBLIC_ env vars are not set.
// Source: contracts.deployed.json
const LIVE_CONTRACT_HASHES: Record<string, string> = {
  agent_registry: "hash-8ddaf7548dfc4505aed7a62a3d4c3fa4936ab8797771988cc6d560eed99b3ded",
  insurance: "hash-b4d195a93712eb2f801549901756b1accb899b8f76d27bff57162ffec3d92b06",
  treasury: "hash-45e1049d82b95dd82119c7462f2d90a4bbf5f1978e3336cf6ba3437f7540bcee",
  rwa_vault: "hash-4898c97682442a9929e36b735cd645f42aa489540f07e9061f117e3f4cc50b21",
  carbon_guard: "hash-3cbe0c274dd0728cf626c26aad333647b657d6ab0548aef983688271fffed63f",
}

// Try NEXT_PUBLIC_ env vars first (client-side accessible), then fall back
// to hardcoded live values.
const CONTRACT_HASHES: Record<string, string> = {
  agent_registry: process.env.NEXT_PUBLIC_CONTRACT_AGENT_REGISTRY ?? LIVE_CONTRACT_HASHES.agent_registry,
  insurance: process.env.NEXT_PUBLIC_CONTRACT_INSURANCE ?? LIVE_CONTRACT_HASHES.insurance,
  treasury: process.env.NEXT_PUBLIC_CONTRACT_TREASURY ?? LIVE_CONTRACT_HASHES.treasury,
  rwa_vault: process.env.NEXT_PUBLIC_CONTRACT_RWA_VAULT ?? LIVE_CONTRACT_HASHES.rwa_vault,
  carbon_guard: process.env.NEXT_PUBLIC_CONTRACT_CARBON_GUARD ?? LIVE_CONTRACT_HASHES.carbon_guard,
}

export function isRealDeployMode(): boolean {
  // Real deploy mode is always true now — contract hashes are hardcoded
  // as fallback (verified live on Casper Testnet 2026-07-07).
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
 *
 * `contractHash` must be the hex form (with or without `hash-` prefix)
 * of the deployed contract's hash, e.g. `hash-abcdef...` or `abcdef...`.
 * Use `getContractHash(module)` to look it up by module name.
 */
export function buildContractCallDeploy(
  params: DeployParams,
  contractHash: string,
  entryPoint: string,
  args: Record<string, unknown>,
): BuildDeployResult {
  const account = PublicKey.fromHex(params.publicKey)

  // Build runtime args. SDK 5.0.12's Args.insert returns void, so we
  // can't chain — construct the Args instance first, then insert one-by-one.
  const runtimeArgs = new Args(new Map())
  for (const [key, value] of Object.entries(args)) {
    runtimeArgs.insert(key, toCLValue(value))
  }

  // Session: stored contract by hash. SDK 5.0.12 has no
  // `ExecutableDeployItem.newStoredContractByHash` static — construct the
  // inner object then wrap it in an ExecutableDeployItem.
  const cleanHash = contractHash.replace(/^hash-/, "")
  const contractHashObj = ContractHash.newContract(cleanHash)
  const storedSession = new StoredContractByHash(contractHashObj, entryPoint, runtimeArgs)
  const session = new ExecutableDeployItem()
  session.storedContractByHash = storedSession

  // Payment: 3 CSPR default. SDK 5.0.12 has a canonical helper
  // `ExecutableDeployItem.standardPayment(amount)` which produces the
  // correct ModuleBytes + Args({amount: U512}) structure expected by
  // Casper's system::handle_payment. (Manual construction with
  // `newModuleBytes(empty, {amount: CLValue.newCLUInt256(...)})` is WRONG —
  // it tags `amount` as U256, which Casper rejects with
  // "type mismatch: expected U512, got U256".)
  const paymentMotes = params.paymentMotes ?? "3000000000" // 3 CSPR
  const payment = ExecutableDeployItem.standardPayment(paymentMotes)

  // Header: SDK 5.0.12 DeployHeader constructor order is
  //   (chainName, dependencies, gasPrice, timestamp, ttl, account, bodyHash)
  // — NOT the old (account, ttl, deps, chainName) order.
  const header = new DeployHeader(
    params.chainName ?? NETWORK_NAME,  // chainName
    [],                                 // dependencies
    1,                                  // gasPrice (testnet standard)
    new Timestamp(new Date()),          // timestamp
    new Duration(params.ttlMs ?? DEFAULT_DEPLOY_TTL_MS),  // ttl
    account,                            // account
  )

  const deploy = Deploy.makeDeploy(header, payment, session)

  return {
    deploy,
    // Deploy.toJSON is a static method in SDK 5.0.12 (not an instance method).
    deployJson: Deploy.toJSON(deploy),
  }
}

// =========================================================================
// Build a simple native CSPR transfer deploy (for x402-style payments).
// =========================================================================

export function buildTransferDeploy(
  params: DeployParams,
  toPublicKeyHex: string,
  amountMotes: string,
  transferId?: string,
): BuildDeployResult {
  const fromKey = PublicKey.fromHex(params.publicKey)
  const toKey = PublicKey.fromHex(toPublicKeyHex)

  // SDK 5.0.12: TransferDeployItem.newTransfer(amount, target, sourcePurse?, id?)
  // returns a TransferDeployItem. Wrap it in an ExecutableDeployItem for the
  // session field.
  const transferItem = TransferDeployItem.newTransfer(
    amountMotes,
    toKey,
    null,           // sourcePurse — null = use account's main purse
    transferId ?? "0",
  )
  const session = new ExecutableDeployItem()
  session.transfer = transferItem

  // Same standardPayment fix as buildContractCallDeploy.
  const paymentMotes = params.paymentMotes ?? "3000000000" // 3 CSPR
  const payment = ExecutableDeployItem.standardPayment(paymentMotes)

  const header = new DeployHeader(
    params.chainName ?? NETWORK_NAME,
    [],
    1,
    new Timestamp(new Date()),
    new Duration(params.ttlMs ?? DEFAULT_DEPLOY_TTL_MS),
    fromKey,
  )

  const deploy = Deploy.makeDeploy(header, payment, session)
  return {
    deploy,
    deployJson: Deploy.toJSON(deploy),
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

function toCLValue(value: unknown): CLValue {
  if (typeof value === "string") return CLValue.newCLString(value)
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value >= 0 && value <= 4294967295) return CLValue.newCLUInt32(value)
      return CLValue.newCLUInt256(value.toString())
    }
    // For floats, encode as string and let the contract parse
    return CLValue.newCLString(value.toString())
  }
  if (typeof value === "boolean") return CLValue.newCLValueBool(value)
  if (typeof value === "bigint") return CLValue.newCLUInt512(value.toString())
  // CLValue is opaque here — if the caller already has a CLValue, pass it through.
  if (value instanceof CLValue) return value
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
