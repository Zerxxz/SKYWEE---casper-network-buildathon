"use client"

import * as React from "react"

export interface NetworkStatus {
  network: "testnet" | "mainnet"
  hasRealData: boolean
  blockHeight: number
  blockHash: string | null
  eraId: number | null
  peerCount: number | null
  validatorCount: number | null
  totalSupply: number | null
  blockTimeSec: number | null
  lastUpdated: string
}

export interface AccountInfo {
  publicKey: string
  hasRealData: boolean
  balanceMotes: string | null
  balanceCSPR: number | null
  accountHash: string | null
  lastDeployHash: string | null
  deployCount: number | null
  lastActive: string | null
  explorerUrl: string
}

/**
 * Polls /api/skywee/network/status on a regular interval.
 * Default poll: every 10 seconds.
 */
export function useNetworkStatus(pollMs = 10_000) {
  const [status, setStatus] = React.useState<NetworkStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    const tick = async () => {
      try {
        const res = await fetch("/api/skywee/network/status")
        const json = await res.json()
        if (!cancelled) {
          if (json.ok) {
            setStatus(json.data)
            setError(null)
          } else {
            setError(json.error ?? "Failed to load")
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    const id = setInterval(tick, pollMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [pollMs])

  return { status, loading, error }
}

/**
 * Fetches account info for a given public key.
 * Re-fetches when publicKey changes.
 */
export function useAccountInfo(publicKey: string | null, pollMs = 15_000) {
  const [account, setAccount] = React.useState<AccountInfo | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!publicKey) {
      setAccount(null)
      return
    }

    let cancelled = false
    setLoading(true)

    const tick = async () => {
      try {
        const res = await fetch(`/api/skywee/network/account/${encodeURIComponent(publicKey)}`)
        const json = await res.json()
        if (!cancelled) {
          if (json.ok) {
            setAccount(json.data)
            setError(null)
          } else {
            setError(json.error ?? "Failed to load account")
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    tick()
    const id = setInterval(tick, pollMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [publicKey, pollMs])

  return { account, loading, error }
}
