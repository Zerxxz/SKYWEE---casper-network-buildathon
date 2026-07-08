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
    // 1. A full signed deploy object (from signDeploy method)
    // 2. A reconstruction object { __needsReconstruction, unsignedDeploy, signature, signerPublicKey }
    // 3. A JSON string
    let deployToBroadcast: unknown = body.signedDeploy

    // Check if this needs reconstruction (wallet returned only signature)
    const signedDeployObj = body.signedDeploy as { __needsReconstruction?: boolean; unsignedDeploy?: unknown; signature?: unknown; signerPublicKey?: string }
    if (signedDeployObj?.__needsReconstruction && signedDeployObj.unsignedDeploy && signedDeployObj.signature) {
      console.log("[broadcast] 🔧 Reconstructing signed deploy from unsigned deploy + signature")

      try {
        const { Deploy, PublicKey } = await import("casper-js-sdk")

        // Parse the unsigned deploy
        const deploy = Deploy.fromJSON(signedDeployObj.unsignedDeploy as never)
        console.log("[broadcast] Parsed unsigned deploy successfully")

        // Parse the signature — it might be hex string or bytes
        let signatureBytes: Uint8Array
        const sig = signedDeployObj.signature
        if (typeof sig === "string") {
          // Hex string — remove 0x prefix if present
          const hex = sig.startsWith("0x") ? sig.slice(2) : sig
          signatureBytes = new Uint8Array(hex.length / 2)
          for (let i = 0; i < signatureBytes.length; i++) {
            signatureBytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
          }
        } else if (sig instanceof Uint8Array) {
          signatureBytes = sig
        } else {
          throw new Error(`Unexpected signature type: ${typeof sig}`)
        }
        console.log("[broadcast] Signature bytes length:", signatureBytes.length)

        // Parse signer public key
        const publicKey = PublicKey.fromHex(signedDeployObj.signerPublicKey)

        // Attach signature to deploy
        const signedDeploy = Deploy.setSignature(deploy, signatureBytes, publicKey)
        console.log("[broadcast] ✅ Signature attached to deploy")

        // Convert to JSON for RPC
        const deployJson = Deploy.toJSON(signedDeploy)
        deployToBroadcast = typeof deployJson === "string" ? JSON.parse(deployJson) : deployJson
        console.log("[broadcast] Reconstructed deploy keys:", Object.keys(deployToBroadcast as object))
      } catch (e) {
        console.error("[broadcast] Reconstruction failed:", e)
        return err(`Failed to reconstruct signed deploy: ${e instanceof Error ? e.message : String(e)}`, 500)
      }
    } else if (typeof body.signedDeploy === "string") {
      // If it's a string, try to parse it
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

      // Log full deploy structure (truncated) for debugging
      try {
        const deployStr = JSON.stringify(deployToBroadcast)
        console.log("[broadcast] Full deploy JSON (first 1000 chars):", deployStr.substring(0, 1000))
        console.log("[broadcast] Full deploy JSON length:", deployStr.length, "chars")
      } catch {
        console.log("[broadcast] Could not stringify deploy")
      }
    }

    // Normalize the deploy format using the SDK's Deploy.fromJSON
    // This ensures the deploy is in the correct format expected by Casper 2.x RPC
    let normalizedDeploy: unknown = deployToBroadcast
    try {
      const { Deploy } = await import("casper-js-sdk")
      const deployObj = Deploy.fromJSON(deployToBroadcast as never)
      // Convert back to JSON object — this normalizes the format
      const deployJson = Deploy.toJSON(deployObj)
      normalizedDeploy = typeof deployJson === "string" ? JSON.parse(deployJson) : deployJson
      console.log("[broadcast] ✅ Deploy normalized via SDK Deploy.fromJSON + toJSON")
      console.log("[broadcast] Normalized deploy keys:", Object.keys(normalizedDeploy as object))
    } catch (e) {
      console.warn("[broadcast] SDK normalization failed, using raw deploy:", e instanceof Error ? e.message : String(e))
      // Continue with raw deploy
    }

    // Use raw fetch to RPC — more reliable than SDK for Casper 2.x
    // CSPR.cloud expects raw token (no "Bearer" prefix)
    const rpcPayload = {
      jsonrpc: "2.0",
      id: 1,
      method: "account_put_deploy",
      params: [normalizedDeploy],
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
