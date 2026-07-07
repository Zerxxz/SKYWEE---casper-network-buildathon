/**
 * GET /api/skywee/deploys/[hash]
 *   Returns the status of a deploy by hash.
 *   In live mode, queries the Casper RPC node.
 *   In simulation mode, looks up the local DB.
 */
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"
import { EXPLORER } from "@/lib/skywee/cspr-cloud"

export const dynamic = "force-dynamic"

const RPC_URL = process.env.CASPER_RPC_URL ?? ""

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const { hash } = await params
    if (!hash) return err("hash is required", 400)

    // Try RPC first if configured
    if (RPC_URL) {
      try {
        const { RpcClient, HttpHandler } = await import("casper-js-sdk")
        const handler = new HttpHandler(RPC_URL)
        // CSPR.cloud requires Bearer auth on every request.
        const authToken = process.env.CSPR_CLOUD_AUTH_TOKEN
        if (authToken) {
          handler.setCustomHeaders({
            "Authorization": `Bearer ${authToken}`,
          })
        }
        const client = new RpcClient(handler)
        const info = await client.getDeploy(hash)
        if (info) {
          return ok({
            hash,
            status: "confirmed",
            explorerUrl: EXPLORER.deploy(hash),
            source: "live",
            raw: info,
          })
        }
      } catch (e) {
        console.warn("RPC getDeploy failed:", e instanceof Error ? e.message : String(e))
      }
    }

    // Simulation fallback — check DB
    const tx = await db.transaction.findUnique({ where: { hash } })
    if (tx) {
      return ok({
        hash,
        status: tx.status,
        explorerUrl: EXPLORER.deploy(hash),
        source: "simulation",
        module: tx.module,
        type: tx.type,
        blockHeight: tx.blockHeight,
        createdAt: tx.createdAt,
      })
    }

    // Not found anywhere
    return ok({
      hash,
      status: "unknown",
      explorerUrl: EXPLORER.deploy(hash),
      source: "unknown",
    })
  } catch (e) {
    return err("Failed to fetch deploy status", 500, e instanceof Error ? e.message : String(e))
  }
}
