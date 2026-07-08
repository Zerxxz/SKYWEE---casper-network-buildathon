/**
 * POST /api/skywee/deploys/broadcast
 *
 * Body:
 *   signedDeploy: object | string  (signed deploy from Casper Wallet)
 *   module: string        (which SKYWEE contract — for logging)
 *   entryPoint: string    (e.g. "register_agent")
 *
 * Forwards the signed deploy to the Casper RPC node.
 * Returns the deploy hash + explorer URL with broadcast="live".
 *
 * If broadcast fails, returns the error (does NOT silently fall back to simulation).
 */
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"
import { EXPLORER } from "@/lib/skywee/cspr-cloud"

export const dynamic = "force-dynamic"

const RPC_URL = process.env.CASPER_RPC_URL ?? ""
const AUTH_TOKEN = process.env.CSPR_CLOUD_AUTH_TOKEN ?? ""

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      signedDeploy?: unknown
      module?: string
      entryPoint?: string
      callerAddr?: string
      metadata?: Record<string, unknown>
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (!body.signedDeploy) return err("signedDeploy is required", 400)
    if (!body.module) return err("module is required", 400)

    console.log("[broadcast] Received deploy for module:", body.module, "entryPoint:", body.entryPoint)
    console.log("[broadcast] signedDeploy type:", typeof body.signedDeploy)
    console.log("[broadcast] RPC_URL:", RPC_URL ? "set" : "NOT SET")
    console.log("[broadcast] AUTH_TOKEN:", AUTH_TOKEN ? "set" : "NOT SET")

    if (!RPC_URL) {
      return err("CASPER_RPC_URL not configured on server", 500)
    }

    // The signed deploy from Casper Wallet might be:
    // - A JSON object (standard signDeploy)
    // - A JSON string (some sign() methods return string)
    // - An object with different structure
    let deployToBroadcast: unknown = body.signedDeploy

    // If it's a string, try to parse it
    if (typeof body.signedDeploy === "string") {
      try {
        deployToBroadcast = JSON.parse(body.signedDeploy)
        console.log("[broadcast] Parsed string deploy to object")
      } catch {
        console.log("[broadcast] Could not parse string deploy, sending as-is")
      }
    }

    // Log the deploy structure for debugging
    if (typeof deployToBroadcast === "object" && deployToBroadcast !== null) {
      const deployObj = deployToBroadcast as Record<string, unknown>
      console.log("[broadcast] Deploy keys:", Object.keys(deployObj))
      console.log("[broadcast] Has hash:", "hash" in deployObj)
      console.log("[broadcast] Has header:", "header" in deployObj)
      console.log("[broadcast] Has payment:", "payment" in deployObj)
      console.log("[broadcast] Has session:", "session" in deployObj)
      console.log("[broadcast] Has approvals:", "approvals" in deployObj)
    }

    // Use raw fetch to RPC — more reliable than SDK for Casper 2.x
    // CSPR.cloud expects raw token (no "Bearer" prefix)
    const rpcPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "account_put_deploy",
      params: [deployToBroadcast],
    }

    console.log("[broadcast] Sending to RPC:", RPC_URL)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (AUTH_TOKEN) {
      headers["Authorization"] = AUTH_TOKEN
    }

    const rpcResponse = await fetch(RPC_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(rpcPayload),
    })

    console.log("[broadcast] RPC response status:", rpcResponse.status)

    const rpcText = await rpcResponse.text()
    console.log("[broadcast] RPC response body (first 500 chars):", rpcText.substring(0, 500))

    if (!rpcResponse.ok) {
      return err(
        `RPC returned HTTP ${rpcResponse.status}: ${rpcText.substring(0, 200)}`,
        502,
      )
    }

    // Parse RPC response
    let rpcResult: { jsonrpc?: string; result?: { deploy_hash?: string }; error?: { code?: number; message?: string } }
    try {
      rpcResult = JSON.parse(rpcText)
    } catch {
      return err(`RPC returned invalid JSON: ${rpcText.substring(0, 200)}`, 502)
    }

    if (rpcResult.error) {
      return err(
        `RPC error ${rpcResult.error.code}: ${rpcResult.error.message}`,
        502,
      )
    }

    const deployHash = rpcResult.result?.deploy_hash
    if (!deployHash) {
      return err("RPC did not return deploy_hash", 502)
    }

    console.log("[broadcast] ✅ Deploy broadcast successfully! Hash:", deployHash)

    // Record in DB
    try {
      await db.transaction.create({
        data: {
          hash: deployHash,
          module: body.module,
          type: body.entryPoint ?? "contract-call",
          agentName: null,
          amountCSPR: 0,
          status: "pending",
          blockHeight: currentBlock(),
          callerAddr: body.callerAddr,
          metadata: JSON.stringify({
            ...body.metadata,
            liveMode: true,
            entryPoint: body.entryPoint,
          }),
        },
      })
    } catch (dbErr) {
      console.warn("[broadcast] DB write failed (non-critical):", dbErr)
    }

    return ok({
      deployHash,
      explorerUrl: EXPLORER.deploy(deployHash),
      broadcast: "live",
      module: body.module,
      entryPoint: body.entryPoint,
    })
  } catch (e) {
    console.error("[broadcast] Unhandled error:", e)
    return err("Failed to broadcast deploy", 500, e instanceof Error ? e.message : String(e))
  }
}
