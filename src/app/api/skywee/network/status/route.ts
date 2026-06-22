/**
 * GET /api/skywee/network/status
 *   Returns live Casper Testnet network status from CSPR.cloud.
 *   Falls back to cached/synthetic data when API key is missing.
 */
import { getNetworkStatus } from "@/lib/skywee/cspr-cloud"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const status = await getNetworkStatus()
    return ok(status)
  } catch (e) {
    return err("Failed to fetch network status", 500, e instanceof Error ? e.message : String(e))
  }
}
