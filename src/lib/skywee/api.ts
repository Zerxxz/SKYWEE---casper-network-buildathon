/**
 * SKYWEE API — shared utilities for API routes.
 *
 * In production, these helpers would proxy to the Odra contracts on Casper
 * Testnet via CSPR.cloud APIs. In this prototype, they simulate the on-chain
 * interaction by writing to the local SQLite database and producing
 * transaction hashes that look like Casper deploy hashes.
 */

import { randomBytes } from "crypto"

/**
 * Generate a fake Casper deploy hash (64 hex chars).
 */
export function generateTxHash(): string {
  return "0x" + randomBytes(32).toString("hex")
}

/**
 * The "current" Casper Testnet block height. In production this would be
 * fetched from CSPR.cloud. Here we simulate it increasing over time.
 */
export function currentBlock(): number {
  // Base 2,847,193 + ~1 block per second since project start (2026-06-23)
  const start = new Date("2026-06-23T00:00:00Z").getTime()
  const elapsed = Math.max(0, Date.now() - start)
  return 2_847_193 + Math.floor(elapsed / 1000)
}

/**
 * Standard JSON API response wrapper.
 */
export function ok<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status })
}

export function err(message: string, status = 400, details?: unknown) {
  return Response.json({ ok: false, error: message, details }, { status })
}

/**
 * Read JSON body safely.
 */
export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    const text = await req.text()
    if (!text) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 * Short-form address helper.
 */
export function shortAddr(addr: string): string {
  if (!addr) return "—"
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/**
 * Sleep helper (for simulating on-chain confirmation latency).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
