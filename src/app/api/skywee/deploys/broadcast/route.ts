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
import { Deploy, PublicKey } from "casper-js-sdk"

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
        

        // Parse the unsigned deploy
        const deploy = Deploy.fromJSON(signedDeployObj.unsignedDeploy as never)
        console.log("[broadcast] Parsed unsigned deploy successfully")

        // Parse the signature — Casper Wallet may return it in multiple formats:
        //   1. Hex string: "0xabc123..." or "abc123..."
        //   2. Uint8Array: raw bytes
        //   3. Object with signature in a sub-field:
        //      { signature: "hex..." }
        //      { sig: "hex..." }
        //      { bytes: "hex..." }
        //      { data: "hex..." }
        //      { signature: Uint8Array }
        let signatureBytes: Uint8Array
        const sig = signedDeployObj.signature
        console.log("[broadcast] Signature raw type:", typeof sig)
        console.log("[broadcast] Signature raw value (truncated):", JSON.stringify(sig).substring(0, 200))

        // Helper: hex string → Uint8Array
        const hexToBytes = (hex: string): Uint8Array => {
          const clean = hex.startsWith("0x") ? hex.slice(2) : hex
          const bytes = new Uint8Array(clean.length / 2)
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
          }
          return bytes
        }

        if (typeof sig === "string") {
          // Hex string
          signatureBytes = hexToBytes(sig)
          console.log("[broadcast] Parsed signature from hex string")
        } else if (sig instanceof Uint8Array) {
          signatureBytes = sig
          console.log("[broadcast] Parsed signature from Uint8Array")
        } else if (sig && typeof sig === "object") {
          // Object — could be:
          //   1. { signature: "hex..." } or similar sub-field
          //   2. Serialized Uint8Array: { "0": 253, "1": 224, "2": 200, ... }
          //      (this happens when JSON.stringify(Uint8Array) is sent over the wire)
          //   3. Array: [253, 224, 200, ...]
          const sigObj = sig as Record<string, unknown>
          console.log("[broadcast] Signature object keys:", Object.keys(sigObj))

          // Check if this is a serialized Uint8Array (numeric keys 0,1,2,3...)
          const keys = Object.keys(sigObj)
          const isSerializedBytes = keys.length > 0 && keys.every((k) => /^\d+$/.test(k))
          if (isSerializedBytes) {
            // Convert { "0": 253, "1": 224, ... } → Uint8Array
            const len = keys.length
            signatureBytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              signatureBytes[i] = sigObj[String(i)] as number
            }
            console.log("[broadcast] Parsed signature from serialized Uint8Array (numeric keys)")
          } else if (Array.isArray(sig)) {
            // Plain number array
            signatureBytes = new Uint8Array(sig as number[])
            console.log("[broadcast] Parsed signature from number array")
          } else {
            // Try common field names that might contain the signature
            const possibleFields = ["signature", "sig", "bytes", "data", "value", "raw"]
            let found = false
            for (const field of possibleFields) {
              const val = sigObj[field]
              if (typeof val === "string") {
                signatureBytes = hexToBytes(val)
                console.log(`[broadcast] Parsed signature from object field '${field}' (hex string)`)
                found = true
                break
              } else if (val instanceof Uint8Array) {
                signatureBytes = val
                console.log(`[broadcast] Parsed signature from object field '${field}' (Uint8Array)`)
                found = true
                break
              } else if (Array.isArray(val)) {
                signatureBytes = new Uint8Array(val as number[])
                console.log(`[broadcast] Parsed signature from object field '${field}' (number array)`)
                found = true
                break
              } else if (val && typeof val === "object") {
                // Nested serialized bytes
                const nestedKeys = Object.keys(val as Record<string, unknown>)
                const isNestedBytes = nestedKeys.length > 0 && nestedKeys.every((k) => /^\d+$/.test(k))
                if (isNestedBytes) {
                  const nested = val as Record<string, number>
                  signatureBytes = new Uint8Array(nestedKeys.length)
                  for (let i = 0; i < nestedKeys.length; i++) {
                    signatureBytes[i] = nested[String(i)]
                  }
                  console.log(`[broadcast] Parsed signature from object field '${field}' (nested bytes)`)
                  found = true
                  break
                }
              }
            }

            if (!found) {
              throw new Error(
                `Could not extract signature from object. Keys: ${keys.join(", ")}. ` +
                `Full object: ${JSON.stringify(sig).substring(0, 300)}`
              )
            }
          }
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
    // Try both methods: account_put_deploy (Casper 1.x) and account_put_transaction (Casper 2.x)
    const rpcMethods = ["account_put_deploy", "account_put_transaction"]

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (AUTH_TOKEN) {
      headers["Authorization"] = AUTH_TOKEN
    }

    let lastError: string | null = null
    let deployHash: string | null = null

    for (const method of rpcMethods) {
      const rpcPayload = {
        jsonrpc: "2.0",
        id: 1,
        method,
        params: [normalizedDeploy],
      }

      console.log(`[broadcast] Trying RPC method: ${method}`)
      console.log(`[broadcast] Sending to RPC:`, RPC_URL)
      console.log(`[broadcast] Deploy keys being sent:`, Object.keys(normalizedDeploy as object))

      // Log the full deploy structure for debugging
      try {
        const deployStr = JSON.stringify(normalizedDeploy)
        console.log(`[broadcast] Full normalized deploy JSON (first 2000 chars):`, deployStr.substring(0, 2000))
        console.log(`[broadcast] Full deploy length:`, deployStr.length, "chars")
      } catch {
        console.log(`[broadcast] Could not stringify normalized deploy`)
      }

      const rpcResponse = await fetch(RPC_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(rpcPayload),
      })

      console.log(`[broadcast] RPC response status (${method}):`, rpcResponse.status)

      const rpcText = await rpcResponse.text()
      console.log(`[broadcast] RPC response body (${method}, first 1000 chars):`, rpcText.substring(0, 1000))

      if (!rpcResponse.ok) {
        lastError = `RPC returned HTTP ${rpcResponse.status}: ${rpcText.substring(0, 300)}`
        console.log(`[broadcast] ${method} failed with HTTP ${rpcResponse.status}, trying next method...`)
        continue
      }

      // Parse RPC response
      let rpcResult: { jsonrpc?: string; result?: { deploy_hash?: string; transaction_hash?: string }; error?: { code?: number; message?: string; data?: unknown } }
      try {
        rpcResult = JSON.parse(rpcText)
      } catch {
        lastError = `RPC returned invalid JSON: ${rpcText.substring(0, 300)}`
        console.log(`[broadcast] ${method} returned invalid JSON, trying next method...`)
        continue
      }

      if (rpcResult.error) {
        lastError = `RPC error ${rpcResult.error.code}: ${rpcResult.error.message}` +
          (rpcResult.error.data ? ` (data: ${JSON.stringify(rpcResult.error.data).substring(0, 200)})` : "")
        console.log(`[broadcast] ${method} returned error:`, rpcResult.error)
        // -32601 means method not found — try next method
        if (rpcResult.error.code === -32601) {
          continue
        }
        // For other errors, return immediately (don't try next method)
        return err(lastError, 502)
      }

      // Success! Extract deploy hash
      deployHash = rpcResult.result?.deploy_hash ?? rpcResult.result?.transaction_hash ?? null
      if (deployHash) {
        console.log(`[broadcast] ✅ Deploy broadcast successfully via ${method}! Hash:`, deployHash)
        break
      }

      lastError = `RPC did not return deploy_hash or transaction_hash`
      console.log(`[broadcast] ${method} did not return hash, trying next method...`)
    }

    if (!deployHash) {
      return err(lastError ?? "All RPC methods failed", 502)
    }

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
