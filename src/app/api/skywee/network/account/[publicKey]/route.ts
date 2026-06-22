/**
 * GET /api/skywee/network/account/[publicKey]
 *   Returns live Casper account info from CSPR.cloud.
 */
import { NextRequest } from "next/server"
import { getAccountInfo, EXPLORER } from "@/lib/skywee/cspr-cloud"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicKey: string }> },
) {
  try {
    const { publicKey } = await params
    if (!publicKey) return err("publicKey is required", 400)

    const info = await getAccountInfo(publicKey)
    return ok({
      ...info,
      explorerUrl: EXPLORER.account(publicKey),
    })
  } catch (e) {
    return err("Failed to fetch account info", 500, e instanceof Error ? e.message : String(e))
  }
}
