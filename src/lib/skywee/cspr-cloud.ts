/**
 * CSPR.cloud — Casper Testnet / Mainnet integration client.
 *
 * Uses the official CSPR.cloud REST API (https://api.cspr.cloud or
 * https://api.testnet.cspr.cloud). All calls are server-side only.
 *
 * Authentication:
 *   CSPR.cloud requires an API key (raw token, no "Bearer" prefix).
 *   Set CSPR_CLOUD_AUTH_TOKEN (or the legacy CSPR_CLOUD_API_KEY) in your
 *   environment. You can obtain a free key at https://cspr.cloud after
 *   signing up. The key grants read access to:
 *     - Network status (info, era, peers)
 *     - Blocks
 *     - Account balances & deploys
 *     - Deploys & transfers
 *
 * Without an API key, the client gracefully falls back to cached/synthetic
 * data so the UI continues to function (useful for hackathon demos without
 * requiring attendees to register an API key).
 *
 * Rate limits:
 *   CSPR.cloud free tier: 60 requests / minute. We cache aggressively to
 *   stay well under the limit.
 */

const NETWORK = process.env.CSPR_NETWORK ?? "testnet"
// Support both env var names — CSPR_CLOUD_AUTH_TOKEN is what's deployed on Vercel,
// CSPR_CLOUD_API_KEY is the older name kept for backward compatibility.
const API_KEY = process.env.CSPR_CLOUD_AUTH_TOKEN ?? process.env.CSPR_CLOUD_API_KEY
const BASE_URL = NETWORK === "mainnet"
  ? "https://api.cspr.cloud"
  : "https://api.testnet.cspr.cloud"

// cspr.live deep-link base (the public block explorer)
export const EXPLORER_URL = NETWORK === "mainnet"
  ? "https://cspr.live"
  : "https://testnet.cspr.live"

// =========================================================================
// In-memory cache (5s TTL — short enough to feel live, long enough to
// avoid hammering the API during polling).
// =========================================================================
const CACHE_TTL_MS = 5_000
const cache = new Map<string, { ts: number; data: unknown }>()

function getCached<T>(key: string): T | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.data as T
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { ts: Date.now(), data })
}

// =========================================================================
// Low-level fetch with auth + caching + error handling
// =========================================================================
async function csprFetch<T>(path: string, opts: RequestInit = {}): Promise<T | null> {
  // Cache lookup
  const cacheKey = `GET ${path}`
  const cached = getCached<T>(cacheKey)
  if (cached) return cached

  // If no API key configured, return null (caller handles fallback)
  if (!API_KEY) return null

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers: {
        "Accept": "application/json",
        // CSPR.cloud API expects the raw token without "Bearer" prefix.
        // Tested 2026-07-08: Bearer format returns 401 "access key not found".
        "Authorization": API_KEY,
        ...(opts.headers ?? {}),
      },
      // Use Next.js fetch cache for additional layer
      next: { revalidate: 5 },
    })

    if (!res.ok) {
      // 401, 403, 404, 429, 5xx — fall back gracefully
      return null
    }

    const data = (await res.json()) as T
    setCached(cacheKey, data)
    return data
  } catch {
    // Network error — fall back
    return null
  }
}

// =========================================================================
// Public types
// =========================================================================
export interface NetworkStatus {
  network: "testnet" | "mainnet"
  hasRealData: boolean
  /** Latest block height */
  blockHeight: number
  /** Latest block hash */
  blockHash: string | null
  /** Current era number */
  eraId: number | null
  /** Number of peers */
  peerCount: number | null
  /** Active validator count */
  validatorCount: number | null
  /** Total supply in CSPR */
  totalSupply: number | null
  /** Block time in seconds */
  blockTimeSec: number | null
  /** Last updated ISO timestamp */
  lastUpdated: string
}

export interface AccountInfo {
  publicKey: string
  hasRealData: boolean
  /** Balance in motes (1 CSPR = 1e9 motes) */
  balanceMotes: string | null
  /** Balance in CSPR */
  balanceCSPR: number | null
  /** Account hex hash */
  accountHash: string | null
  /** Last active deploy hash */
  lastDeployHash: string | null
  /** Total deploy count */
  deployCount: number | null
  /** Timestamp of last activity */
  lastActive: string | null
}

export interface BlockInfo {
  height: number
  hash: string
  eraId: number
  timestamp: string
  proposer: string | null
  transactionCount: number | null
  hasRealData: boolean
}

// =========================================================================
// API methods
// =========================================================================

/**
 * Fetch the latest network status from CSPR.cloud.
 * Falls back to synthetic data when API key is missing.
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  // CSPR.cloud doesn't have a /network/info endpoint — fetch latest block + supply in parallel
  const [blockRes, supplyRes] = await Promise.all([
    csprFetch<{
      data?: Array<{
        block_height?: number
        block_hash?: string
        era_id?: number
        timestamp?: string
        proposer_public_key?: string
      }>
    }>("/blocks?limit=1"),
    csprFetch<{
      data?: {
        total?: string
        circulating?: string
      }
    }>("/supply"),
  ])

  const block = blockRes?.data?.[0]
  if (block) {
    const totalSupplyStr = supplyRes?.data?.total
    return {
      network: NETWORK as "testnet" | "mainnet",
      hasRealData: true,
      blockHeight: block.block_height ?? 0,
      blockHash: block.block_hash ?? null,
      eraId: block.era_id ?? null,
      peerCount: null,
      validatorCount: null,
      totalSupply: totalSupplyStr
        ? parseInt(totalSupplyStr, 10) / 1e9
        : null,
      blockTimeSec: 16,
      lastUpdated: new Date().toISOString(),
    }
  }

  // Fallback: synthetic but plausible block height that advances over time
  const startTime = new Date("2026-06-01T00:00:00Z").getTime()
  const elapsed = Math.max(0, Date.now() - startTime)
  const blocksPerSec = 1 / 16 // Casper block time ≈ 16s
  const baseHeight = 2_847_193 + Math.floor(elapsed * blocksPerSec / 1000)

  return {
    network: NETWORK as "testnet" | "mainnet",
    hasRealData: false,
    blockHeight: baseHeight,
    blockHash: null,
    eraId: null,
    peerCount: null,
    validatorCount: null,
    totalSupply: null,
    blockTimeSec: 16,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Fetch account info (balance, deploys) from CSPR.cloud.
 */
export async function getAccountInfo(publicKey: string): Promise<AccountInfo> {
  if (!publicKey) {
    return {
      publicKey: "",
      hasRealData: false,
      balanceMotes: null,
      balanceCSPR: null,
      accountHash: null,
      lastDeployHash: null,
      deployCount: null,
      lastActive: null,
    }
  }

  // CSPR.cloud account endpoint: GET /accounts/{publicKey}
  // API returns snake_case fields: account_hash, public_key, balance, etc.
  const account = await csprFetch<{
    data?: {
      public_key?: string
      balance?: string
      account_hash?: string
      main_purse_uref?: string
    }
  }>(`/accounts/${publicKey}`)

  if (account?.data) {
    const balanceMotes = account.data.balance ?? null
    return {
      publicKey,
      hasRealData: true,
      balanceMotes,
      balanceCSPR: balanceMotes ? parseInt(balanceMotes, 10) / 1e9 : null,
      accountHash: account.data.account_hash ?? null,
      lastDeployHash: null,
      deployCount: null,
      lastActive: null,
    }
  }

  // Fallback — demo account with a plausible balance
  return {
    publicKey,
    hasRealData: false,
    balanceMotes: null,
    balanceCSPR: 1_000,
    accountHash: null,
    lastDeployHash: null,
    deployCount: 0,
    lastActive: null,
  }
}

/**
 * Fetch the latest N blocks.
 */
export async function getLatestBlocks(limit = 5): Promise<BlockInfo[]> {
  const blocks = await csprFetch<{
    data?: Array<{
      block_height?: number
      block_hash?: string
      era_id?: number
      timestamp?: string
      proposer_public_key?: string
      native_transfers_number?: number
      contract_calls_number?: number
      large_txn_number?: number
      medium_txn_number?: number
    }>
  }>(`/blocks?limit=${limit}`)

  if (blocks?.data && Array.isArray(blocks.data)) {
    return blocks.data.map((b) => ({
      height: b.block_height ?? 0,
      hash: b.block_hash ?? "",
      eraId: b.era_id ?? 0,
      timestamp: b.timestamp ?? new Date().toISOString(),
      proposer: b.proposer_public_key ?? null,
      transactionCount: (b.native_transfers_number ?? 0) + (b.contract_calls_number ?? 0) + (b.large_txn_number ?? 0) + (b.medium_txn_number ?? 0),
      hasRealData: true,
    }))
  }

  // Fallback — generate plausible block heights
  const now = Date.now()
  return Array.from({ length: limit }, (_, i) => {
    const height = 2_847_193 - i + Math.floor((Date.now() - now) / 16_000)
    return {
      height,
      hash: `0x${Math.random().toString(16).slice(2).padEnd(64, "0").slice(0, 64)}`,
      eraId: 17_756,
      timestamp: new Date(Date.now() - i * 16_000).toISOString(),
      proposer: null,
      transactionCount: Math.floor(Math.random() * 12),
      hasRealData: false,
    }
  })
}

// =========================================================================
// Explorer URL helpers (for deep links)
// =========================================================================

export function explorerAccountUrl(publicKey: string): string {
  return `${EXPLORER_URL}/account/${publicKey}`
}

export function explorerDeployUrl(deployHash: string): string {
  return `${EXPLORER_URL}/deploy/${deployHash}`
}

export function explorerBlockUrl(blockHeight: number | string): string {
  return `${EXPLORER_URL}/block/${blockHeight}`
}

export const EXPLORER = {
  live: EXPLORER_URL,
  account: explorerAccountUrl,
  deploy: explorerDeployUrl,
  block: explorerBlockUrl,
}
