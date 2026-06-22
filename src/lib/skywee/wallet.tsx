"use client"

import * as React from "react"

/**
 * CasperWalletProvider — the official global injected by the Casper Wallet
 * browser extension. Spec: https://github.com/casper-network/casper-wallet
 *
 * In a real environment with the extension installed, this object is present
 * on `window`. We type it loosely here and call its methods defensively so
 * that the app never crashes in environments without the extension.
 */
export interface CasperWalletProvider {
  isConnected(): Promise<boolean>
  requestConnection(): Promise<boolean>
  disconnectFromSite(): Promise<boolean | void>
  getActivePublicKey(): Promise<string>
  signMessage(
    message: string,
    publicKey: string,
  ): Promise<{ signature?: string; cancelled?: boolean }>
  signDeploy(
    deploy: unknown,
    signingPublicKey: string,
  ): Promise<{ deploy?: unknown; cancelled?: boolean }>
  on(event: "connected", cb: () => void): () => void
  on(event: "disconnected", cb: () => void): () => void
  on(event: "activeKeyChanged", cb: (newKey: string) => void): () => void
  on(event: "tabChanged", cb: (tabId: number) => void): () => void
}

declare global {
  interface Window {
    casperWalletProvider?: CasperWalletProvider
  }
}

export interface WalletState {
  status: "disconnected" | "connecting" | "connected" | "demo"
  publicKey: string | null
  isExtensionInstalled: boolean
  isDemo: boolean
  error: string | null
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  enterDemoMode: () => void
  shortAddress: string | null
  /**
   * Sign a deploy via the Casper Wallet extension.
   * Throws if in demo mode or extension unavailable.
   * Returns the signed deploy JSON.
   */
  signDeploy: (deployJson: unknown) => Promise<unknown>
}

const WalletContext = React.createContext<WalletContextValue | null>(null)

// Demo-mode address — generated deterministically so it's stable per session
function generateDemoPublicKey(): string {
  // Casper public keys are 02 + 64 hex chars (ed25519) — we generate a fake one
  const hex = "0202" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("")
  return hex
}

function shortKey(key: string | null): string | null {
  if (!key) return null
  if (key.length <= 12) return key
  return `${key.slice(0, 6)}…${key.slice(-4)}`
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<WalletState>({
    status: "disconnected",
    publicKey: null,
    isExtensionInstalled: false,
    isDemo: false,
    error: null,
  })

  // Detect extension on mount
  React.useEffect(() => {
    const checkExtension = () => {
      const installed = typeof window !== "undefined" && !!window.casperWalletProvider
      setState((s) => ({ ...s, isExtensionInstalled: installed }))
    }
    checkExtension()

    // Re-check periodically in case extension loads after page
    const interval = setInterval(checkExtension, 1500)
    return () => clearInterval(interval)
  }, [])

  // If extension becomes available, try to detect existing connection
  React.useEffect(() => {
    if (!state.isExtensionInstalled || !window.casperWalletProvider) return

    const provider = window.casperWalletProvider

    const checkConnected = async () => {
      try {
        const connected = await provider.isConnected()
        if (connected) {
          const key = await provider.getActivePublicKey()
          setState((s) => ({
            ...s,
            status: "connected",
            publicKey: key,
            isDemo: false,
            error: null,
          }))
        }
      } catch {
        // ignore — user hasn't connected yet
      }
    }
    checkConnected()

    // Subscribe to events
    const offConnected = provider.on("connected", async () => {
      try {
        const key = await provider.getActivePublicKey()
        setState((s) => ({
          ...s,
          status: "connected",
          publicKey: key,
          isDemo: false,
          error: null,
        }))
      } catch (e) {
        setState((s) => ({ ...s, error: "Failed to read public key" }))
      }
    })

    const offDisconnected = provider.on("disconnected", () => {
      setState((s) => ({
        ...s,
        status: "disconnected",
        publicKey: null,
        isDemo: false,
      }))
    })

    const offKeyChanged = provider.on("activeKeyChanged", (newKey: string) => {
      setState((s) => ({
        ...s,
        publicKey: newKey,
        status: "connected",
        isDemo: false,
      }))
    })

    return () => {
      offConnected?.()
      offDisconnected?.()
      offKeyChanged?.()
    }
  }, [state.isExtensionInstalled])

  const connect = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "connecting", error: null }))

    if (typeof window === "undefined" || !window.casperWalletProvider) {
      // No extension — fall back to demo mode after a brief delay so the
      // "Connecting..." state is visible (mimics extension popup delay).
      await new Promise((r) => setTimeout(r, 800))
      setState((s) => ({
        ...s,
        status: "demo",
        publicKey: generateDemoPublicKey(),
        isDemo: true,
      }))
      return
    }

    try {
      const provider = window.casperWalletProvider
      const accepted = await provider.requestConnection()
      if (!accepted) {
        setState((s) => ({
          ...s,
          status: "disconnected",
          error: "Connection request rejected",
        }))
        return
      }
      const key = await provider.getActivePublicKey()
      setState((s) => ({
        ...s,
        status: "connected",
        publicKey: key,
        isDemo: false,
        error: null,
      }))
    } catch (e) {
      setState((s) => ({
        ...s,
        status: "disconnected",
        error: e instanceof Error ? e.message : "Failed to connect wallet",
      }))
    }
  }, [])

  const disconnect = React.useCallback(async () => {
    if (window.casperWalletProvider && !state.isDemo) {
      try {
        await window.casperWalletProvider.disconnectFromSite()
      } catch {
        // ignore
      }
    }
    setState((s) => ({
      ...s,
      status: "disconnected",
      publicKey: null,
      isDemo: false,
    }))
  }, [state.isDemo])

  const enterDemoMode = React.useCallback(() => {
    setState((s) => ({
      ...s,
      status: "demo",
      publicKey: generateDemoPublicKey(),
      isDemo: true,
      error: null,
    }))
  }, [])

  /**
   * Sign a deploy via the Casper Wallet extension.
   * Throws if demo mode or extension unavailable.
   */
  const signDeploy = React.useCallback(
    async (deployJson: unknown): Promise<unknown> => {
      if (state.isDemo) {
        throw new Error("Cannot sign deploys in demo mode")
      }
      if (typeof window === "undefined" || !window.casperWalletProvider) {
        throw new Error("Casper Wallet extension not available")
      }
      if (!state.publicKey) {
        throw new Error("No active public key")
      }

      const result = await window.casperWalletProvider.signDeploy(
        deployJson,
        state.publicKey,
      )

      if (result.cancelled) {
        throw new Error("User cancelled the signing request")
      }
      if (!result.deploy) {
        throw new Error("Wallet did not return a signed deploy")
      }
      return result.deploy
    },
    [state.isDemo, state.publicKey],
  )

  const value: WalletContextValue = React.useMemo(
    () => ({
      ...state,
      connect,
      disconnect,
      enterDemoMode,
      signDeploy,
      shortAddress: shortKey(state.publicKey),
    }),
    [state, connect, disconnect, enterDemoMode, signDeploy],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet(): WalletContextValue {
  const ctx = React.useContext(WalletContext)
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider")
  }
  return ctx
}
