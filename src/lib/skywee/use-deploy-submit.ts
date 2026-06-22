"use client"

import * as React from "react"
import { useWallet } from "./wallet"
import {
  buildContractCallDeploy,
  isDemoWallet,
  signDeployWithWallet,
  type DeployParams,
} from "./casper-deploy"

export interface DeploySubmitOptions {
  /** Which SKYWEE module/contract to call */
  module: "agent_registry" | "insurance" | "treasury" | "rwa_vault" | "carbon_guard"
  /** Contract entry point name */
  entryPoint: string
  /** Runtime args for the entry point */
  args: Record<string, unknown>
  /** Called after the deploy is broadcast (live or simulated). Returns the
   *  simulation result that should be merged into the modal success state. */
  onBroadcastSuccess?: (result: {
    deployHash: string
    explorerUrl: string
    broadcast: "live" | "simulation"
  }) => Promise<unknown> | unknown
}

export interface DeploySubmitResult {
  /** The deploy hash (real or simulated) */
  hash: string
  /** Explorer URL */
  explorerUrl: string
  /** Whether the deploy was broadcast live or simulated */
  broadcast: "live" | "simulation"
  /** Optional data returned by onBroadcastSuccess */
  data?: unknown
}

/**
 * Hook that returns a submit function for use inside an ActionModal.
 *
 * The submit function:
 *   1. If real Casper Wallet is connected (not demo):
 *      a. Builds an unsigned deploy
 *      b. Asks the wallet to sign it
 *      c. POSTs the signed deploy to /api/skywee/deploys/broadcast
 *      d. If broadcast fails (e.g. RPC unreachable), API falls back to simulation
 *   2. If demo mode or no extension:
 *      a. Skips the deploy flow entirely
 *      b. Calls onBroadcastSuccess with a simulated hash
 *
 * Either way, the calling module's API route (e.g. /api/skywee/agents/deploy)
 * is responsible for writing the resulting state to the database.
 */
export function useDeploySubmit() {
  const { publicKey, isDemo, isExtensionInstalled, signDeploy } = useWallet()

  return React.useCallback(
    async (opts: DeploySubmitOptions): Promise<DeploySubmitResult> => {
      if (!publicKey) {
        throw new Error("Connect your wallet first")
      }

      const demo = isDemoWallet(isDemo, isExtensionInstalled)

      // Real deploy flow
      if (!demo && isExtensionInstalled) {
        try {
          const deployParams: DeployParams = {
            publicKey,
            paymentMotes: "1000000000", // 1 CSPR
          }

          // Build the unsigned deploy
          const { deployJson } = buildContractCallDeploy(
            deployParams,
            opts.module,
            opts.entryPoint,
            opts.args,
          )

          // Sign with wallet
          const signedDeploy = await signDeploy(deployJson)

          // Broadcast
          const res = await fetch("/api/skywee/deploys/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              signedDeploy,
              module: opts.module,
              entryPoint: opts.entryPoint,
              callerAddr: publicKey,
              metadata: opts.args,
            }),
          })
          const json = await res.json()
          if (!json.ok) throw new Error(json.error || "Broadcast failed")

          const result = json.data
          const data = opts.onBroadcastSuccess
            ? await opts.onBroadcastSuccess({
                deployHash: result.deployHash,
                explorerUrl: result.explorerUrl,
                broadcast: result.broadcast,
              })
            : undefined

          return {
            hash: result.deployHash,
            explorerUrl: result.explorerUrl,
            broadcast: result.broadcast,
            data,
          }
        } catch (e) {
          // If signing fails or user cancels, rethrow — the modal will show the error
          throw e
        }
      }

      // Demo mode — call onBroadcastSuccess with a synthetic hash
      // The actual DB write happens in the calling module's API route
      // (e.g. /api/skywee/agents/deploy) which already handles simulation.
      const data = opts.onBroadcastSuccess
        ? await opts.onBroadcastSuccess({
            deployHash: "demo",
            explorerUrl: "",
            broadcast: "simulation" as const,
          })
        : undefined

      return {
        hash: (data as { hash?: string } | undefined)?.hash ?? "demo",
        explorerUrl: (data as { explorerUrl?: string } | undefined)?.explorerUrl ?? "",
        broadcast: "simulation",
        data,
      }
    },
    [publicKey, isDemo, isExtensionInstalled, signDeploy],
  )
}

/**
 * Convenience: returns whether the connected wallet can sign real deploys.
 */
export function useCanSignDeploys(): boolean {
  const { isDemo, isExtensionInstalled, publicKey } = useWallet()
  return !!publicKey && !isDemo && isExtensionInstalled
}
