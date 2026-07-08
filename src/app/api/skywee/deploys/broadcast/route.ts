/**
 * POST /api/skywee/deploys/broadcast
 *
 * Forwards the signed deploy to the Casper RPC node.
 * Returns the deploy hash + explorer URL with broadcast="live".
 *
 * If broadcast fails, returns the error (does NOT silently fall back to simulation).
 */
import { db } from "@/lib/db"
import { ok, err, readJson, currentBlock } from "@/lib/skywee/api"
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

    console.log("[broadcast] module:", body.module, "entryPoint:", body.entryPoint)
    console.log("[broadcast] signedDeploy type:", typeof body.signedDeploy)

    if (!RPC_URL) {
      return err("CASPER_RPC_URL not configured on server", 500)
    }

    // Step 1: Determine the deploy to broadcast
    let deployToBroadcast: Record<string, unknown>

    const signedDeployObj = body.signedDeploy as {
      __needsReconstruction?: boolean
      unsignedDeploy?: unknown
      signature?: unknown
      signerPublicKey?: string
    }

    if (signedDeployObj?.__needsReconstruction && signedDeployObj.unsignedDeploy && signedDeployObj.signature) {
      console.log("[broadcast] 🔧 Manual reconstruction (no SDK)")

      // Parse unsigned deploy
      const unsignedDeploy = typeof signedDeployObj.unsignedDeploy === "string"
        ? JSON.parse(signedDeployObj.unsignedDeploy)
        : signedDeployObj.unsignedDeploy as Record<string, unknown>

      console.log("[broadcast] Unsigned deploy keys:", Object.keys(unsignedDeploy))
      console.log("[broadcast] Unsigned deploy hash:", unsignedDeploy?.hash)
      console.log("[broadcast] Account in header:", (unsignedDeploy?.header as Record<string, unknown>)?.account?.toString().substring(0, 30))

      // Convert signature to hex string (NO 0x prefix — Casper RPC rejects it)
      // Error was: "decoding from hex: Invalid byte 'b'x', at index 1"
      // This means RPC got a string starting with "0x" and tried to decode
      // the 'x' as a hex byte — fails. Casper expects RAW hex only.
      const sig = signedDeployObj.signature
      let signatureHex: string

      const bytesToHex = (bytes: Uint8Array): string => {
        return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
      }

      if (typeof sig === "string") {
        // Remove 0x prefix if present, then use raw hex
        signatureHex = sig.startsWith("0x") ? sig.slice(2) : sig
      } else if (sig && typeof sig === "object") {
        const sigObj = sig as Record<string, unknown>
        const keys = Object.keys(sigObj)
        const isSerializedBytes = keys.length > 0 && keys.every((k) => /^\d+$/.test(k))
        if (isSerializedBytes) {
          const bytes = new Uint8Array(keys.length)
          for (let i = 0; i < keys.length; i++) {
            bytes[i] = sigObj[String(i)] as number
          }
          signatureHex = bytesToHex(bytes)
        } else if (Array.isArray(sig)) {
          signatureHex = bytesToHex(new Uint8Array(sig as number[]))
        } else {
          throw new Error(`Could not extract signature from object. Keys: ${keys.join(", ")}`)
        }
      } else if (sig instanceof Uint8Array) {
        signatureHex = bytesToHex(sig)
      } else {
        throw new Error(`Unexpected signature type: ${typeof sig}`)
      }

      console.log("[broadcast] Signature hex (first 40 chars):", signatureHex.substring(0, 40))
      console.log("[broadcast] Signature hex length:", signatureHex.length)

      // Get signer public key — ensure it's hex WITHOUT 0x prefix
      // Casper RPC expects raw hex for all key/signature fields
      const signerRaw = signedDeployObj.signerPublicKey ?? ""
      const signer = signerRaw.startsWith("0x") ? signerRaw.slice(2) : signerRaw
      console.log("[broadcast] Signer pubkey (first 20 chars):", signer.substring(0, 20))

      // MANUALLY add approval — bypass SDK entirely
      // This avoids "asymmetric key error: invalid tag" caused by SDK corrupting key format
      // 0x prefix will be stripped globally in Step 2 below
      deployToBroadcast = {
        ...unsignedDeploy,
        approvals: [
          {
            signer: signer,
            signature: signatureHex,
          },
        ],
      }

      // CRITICAL FIX: Override the header.account field with the raw public key hex
      // SDK's Deploy.toJSON() may serialize the account as a complex object or
      // with a different format than what RPC expects. RPC expects raw hex like:
      //   "0203220e30622aee8574de059922f3d9422c73d84b8372b5926f5e3e1e84277feb43"
      // (tag byte 02 for Ed25519 + 64 hex chars = 66 chars total)
      if (unsignedDeploy?.header) {
        const header = deployToBroadcast.header as Record<string, unknown>
        header.account = signer  // Use the exact same public key hex as the signer
        deployToBroadcast.header = header
        console.log("[broadcast] ✅ Overrode header.account with raw signer pubkey")
      }

      console.log("[broadcast] ✅ Manual reconstruction complete")
      console.log("[broadcast] Deploy hash:", deployToBroadcast.hash)
      console.log("[broadcast] Approvals:", JSON.stringify(deployToBroadcast.approvals)?.substring(0, 200))
    } else if (typeof body.signedDeploy === "string") {
      deployToBroadcast = JSON.parse(body.signedDeploy)
      console.log("[broadcast] Parsed string deploy to object")
    } else {
      deployToBroadcast = body.signedDeploy as Record<string, unknown>
      console.log("[broadcast] Using deploy object as-is")
    }

    // Step 2: Strip 0x prefix from ALL hex strings in the deploy
    // Casper RPC rejects "0x" prefix with: "decoding from hex: Invalid byte 'x' at index 1"
    // This applies to: hash, bodyHash, account, approvals[].signer, approvals[].signature,
    // moduleBytes (which may be "0x" for empty bytes), args bytes, etc.
    //
    // CRITICAL: regex uses * (zero or more) not + (one or more) because
    // moduleBytes for standardPayment is "0x" (empty hex with prefix).
    // Previous regex /^0x[0-9a-fA-F]+$/ missed this case, causing the
    // "Invalid byte 'x' at index 1" error.
    const stripHexPrefix = (obj: unknown): unknown => {
      if (typeof obj === "string") {
        // Match "0x" or "0X" followed by zero or more hex chars
        if (/^0[xX][0-9a-fA-F]*$/.test(obj)) {
          return obj.slice(2)
        }
        return obj
      }
      if (Array.isArray(obj)) {
        return obj.map(stripHexPrefix)
      }
      if (obj && typeof obj === "object") {
        const result: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          result[k] = stripHexPrefix(v)
        }
        return result
      }
      return obj
    }

    deployToBroadcast = stripHexPrefix(deployToBroadcast) as Record<string, unknown>

    // Verify no 0x prefixes remain
    const deployStr = JSON.stringify(deployToBroadcast)
    const remaining0x = deployStr.match(/"0x[0-9a-fA-F]*"/g)
    if (remaining0x) {
      console.warn("[broadcast] ⚠️ 0x prefixes still remaining after strip:", remaining0x.slice(0, 5))
      // Force strip any remaining
      deployToBroadcast = JSON.parse(deployStr.replace(/"0x([0-9a-fA-F]*)"/g, '"$1"')) as Record<string, unknown>
      console.log("[broadcast] Force-stripped remaining 0x prefixes")
    } else {
      console.log("[broadcast] ✅ No 0x prefixes in deploy JSON")
    }

    // Step 3: Log deploy structure
    console.log("[broadcast] Deploy keys:", Object.keys(deployToBroadcast))
    console.log("[broadcast] Has hash:", "hash" in deployToBroadcast)
    console.log("[broadcast] Has header:", "header" in deployToBroadcast)
    console.log("[broadcast] Has payment:", "payment" in deployToBroadcast)
    console.log("[broadcast] Has session:", "session" in deployToBroadcast)
    console.log("[broadcast] Has approvals:", "approvals" in deployToBroadcast)

    // Log the account field from header — this is what RPC validates
    const header = deployToBroadcast.header as Record<string, unknown> | undefined
    if (header) {
      const accountStr = header.account?.toString() ?? ""
      console.log("[broadcast] Header account FULL:", accountStr)
      console.log("[broadcast] Header account length:", accountStr.length)
      console.log("[broadcast] Header account first 2 chars:", accountStr.substring(0, 2))
      console.log("[broadcast] Header chainName:", header.chainName)
    }

    // Log approvals
    const approvals = deployToBroadcast.approvals as Array<Record<string, unknown>> | undefined
    if (approvals && approvals.length > 0) {
      console.log("[broadcast] Approval[0] signer FULL:", approvals[0]?.signer?.toString())
      console.log("[broadcast] Approval[0] signer length:", approvals[0]?.signer?.toString().length)
      console.log("[broadcast] Approval[0] signature first 40:", approvals[0]?.signature?.toString().substring(0, 40))
      console.log("[broadcast] Approval[0] signature length:", approvals[0]?.signature?.toString().length)
    }

    // Compare: signer public key from wallet vs account in header
    // They should be the SAME public key
    if (signedDeployObj?.signerPublicKey) {
      const signerRaw = signedDeployObj.signerPublicKey
      const signerStripped = signerRaw.startsWith("0x") ? signerRaw.slice(2) : signerRaw
      console.log("[broadcast] === PUBLIC KEY COMPARISON ===")
      console.log("[broadcast] Wallet signer (raw):", signerRaw.substring(0, 30))
      console.log("[broadcast] Wallet signer (stripped):", signerStripped.substring(0, 30))
      console.log("[broadcast] Header account:", header?.account?.toString().substring(0, 30))
      console.log("[broadcast] Are they equal?", signerStripped === header?.account?.toString())
    }

    // Log full deploy JSON (truncated)
    try {
      const deployStr = JSON.stringify(deployToBroadcast)
      console.log("[broadcast] Full deploy JSON (first 2000 chars):", deployStr.substring(0, 2000))
    } catch {
      console.log("[broadcast] Could not stringify deploy")
    }

    // Step 3: Send to RPC — try both Casper 1.x and 2.x methods
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
        params: [deployToBroadcast],
      }

      console.log(`[broadcast] Trying RPC method: ${method}`)

      const rpcResponse = await fetch(RPC_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(rpcPayload),
      })

      console.log(`[broadcast] RPC response status (${method}):`, rpcResponse.status)

      const rpcText = await rpcResponse.text()
      console.log(`[broadcast] RPC response (${method}, first 500 chars):`, rpcText.substring(0, 500))

      if (!rpcResponse.ok) {
        lastError = `HTTP ${rpcResponse.status}: ${rpcText.substring(0, 300)}`
        continue
      }

      let rpcResult: {
        jsonrpc?: string
        result?: { deploy_hash?: string; transaction_hash?: string }
        error?: { code?: number; message?: string; data?: unknown }
      }

      try {
        rpcResult = JSON.parse(rpcText)
      } catch {
        lastError = `Invalid JSON: ${rpcText.substring(0, 300)}`
        continue
      }

      if (rpcResult.error) {
        lastError = `RPC error ${rpcResult.error.code}: ${rpcResult.error.message}` +
          (rpcResult.error.data ? ` (data: ${JSON.stringify(rpcResult.error.data).substring(0, 300)})` : "")
        console.log(`[broadcast] ${method} error:`, rpcResult.error)
        // -32601 = method not found → try next
        if (rpcResult.error.code === -32601) {
          continue
        }
        // Other errors → return immediately
        return err(lastError, 502)
      }

      deployHash = rpcResult.result?.deploy_hash ?? rpcResult.result?.transaction_hash ?? null
      if (deployHash) {
        console.log(`[broadcast] ✅ Deploy broadcast via ${method}! Hash:`, deployHash)
        break
      }

      lastError = "RPC did not return deploy_hash"
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
