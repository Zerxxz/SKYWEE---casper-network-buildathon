"use client"

import * as React from "react"

/**
 * CasperWalletProvider — the official global injected by the Casper Wallet
 * browser extension. Spec: https://github.com/casper-network/casper-wallet
 *
 * Multiple injection patterns are supported (see detectProvider() below):
 *   1. window.casperWalletProvider  — modern Casper Wallet (instance)
 *   2. window.CasperWalletProvider  — alternative pattern (constructor)
 *   3. window.casperlabsHelper      — legacy Casper Signer (adapter)
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
  on(event: "tabChange", cb: (tabId: number) => void): () => void
}

declare global {
  interface Window {
    casperWalletProvider?: CasperWalletProvider
    CasperWalletProvider?: new () => CasperWalletProvider
    casperlabsHelper?: unknown
  }
}

export interface WalletState {
  status: "disconnected" | "connecting" | "connected" | "demo"
  publicKey: string | null
  isExtensionInstalled: boolean
  isDemo: boolean
  error: string | null
  /** Diagnostic: which globals are present on window (for debugging) */
  detectedGlobals: string[]
  /** Which provider pattern was detected */
  providerType: "casper-wallet" | "casper-signer" | "none"
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  enterDemoMode: () => void
  /** Force re-detect the extension (user clicked "Retry") */
  recheckExtension: () => void
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

/**
 * Detect any Casper wallet provider on the window object.
 * Returns the provider instance + which pattern was matched, or null.
 *
 * The Casper Wallet extension can inject itself in multiple ways depending
 * on version:
 *   - Modern: window.casperWalletProvider (ready-to-use instance)
 *   - Constructor: window.CasperWalletProvider (needs `new`)
 *   - Legacy Signer: window.casperlabsHelper (different API, needs adapter)
 *   - Alt name: window.casperWallet (some forks)
 *   - alt: window.casperwallet
 *
 * NOTE: Casper Wallet extension injects via content script that may run
 * AFTER page load. The provider may not be available immediately —
 * aggressive polling + user interaction triggers are required.
 */
function detectProvider(): {
  provider: CasperWalletProvider | null
  type: WalletState["providerType"]
  globals: string[]
} {
  if (typeof window === "undefined") {
    return { provider: null, type: "none", globals: [] }
  }

  // Collect ALL Casper-related globals for diagnostics
  // (even ones we don't know how to use — helps user verify extension is loaded)
  const globals: string[] = []
  const casperKeys = Object.keys(window).filter((k) =>
    /casper/i.test(k) || /wallet/i.test(k),
  )
  globals.push(...casperKeys)

  // Also check specific known patterns
  if (window.casperWalletProvider) globals.push("casperWalletProvider")
  if (window.CasperWalletProvider) globals.push("CasperWalletProvider")
  if (window.casperlabsHelper) globals.push("casperlabsHelper")
  // Deduplicate
  const uniqueGlobals = [...new Set(globals)]

  // 1. Modern Casper Wallet — instance already on window
  if (window.casperWalletProvider) {
    return {
      provider: window.casperWalletProvider,
      type: "casper-wallet",
      globals: uniqueGlobals,
    }
  }

  // 2. Constructor pattern — some versions inject a class that needs `new`
  if (typeof window.CasperWalletProvider === "function") {
    try {
      const instance = new window.CasperWalletProvider()
      if (instance && typeof instance.isConnected === "function") {
        return {
          provider: instance,
          type: "casper-wallet",
          globals: uniqueGlobals,
        }
      }
    } catch {
      // Constructor threw — fall through to other detection methods
    }
  }

  // 3. Alt name pattern — some forks/versions use different casing
  const w = window as unknown as Record<string, unknown>
  const altNames = ["casperWallet", "casperwallet", "CasperWallet"]
  for (const name of altNames) {
    const candidate = w[name]
    if (candidate && typeof candidate === "object") {
      const c = candidate as Partial<CasperWalletProvider>
      if (typeof c.isConnected === "function" && typeof c.requestConnection === "function") {
        return {
          provider: candidate as CasperWalletProvider,
          type: "casper-wallet",
          globals: uniqueGlobals,
        }
      }
    }
  }

  // 4. Legacy Casper Signer — different API, would need an adapter.
  // For now we just report it as detected but don't use it (Signer doesn't
  // support signDeploy in the same way). User should install Casper Wallet.
  if (window.casperlabsHelper) {
    return {
      provider: null,
      type: "casper-signer",
      globals: uniqueGlobals,
    }
  }

  return { provider: null, type: "none", globals: uniqueGlobals }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<WalletState>({
    status: "disconnected",
    publicKey: null,
    isExtensionInstalled: false,
    isDemo: false,
    error: null,
    detectedGlobals: [],
    providerType: "none",
  })

  // Keep a ref to the detected provider so connect()/signDeploy() can use it
  // without re-running detection (which could create a new instance each time
  // for the constructor pattern).
  const providerRef = React.useRef<CasperWalletProvider | null>(null)

  // Detect extension on mount + poll SUPER aggressively.
  // Casper Wallet extension injects window.casperWalletProvider via content
  // script that may run AFTER page load. Some extensions only inject after
  // specific events (click, focus, mousemove). We use multiple strategies:
  //   1. Immediate check on mount
  //   2. Poll every 200ms for first 60s (300 checks)
  //   3. Listen for window 'load' event (extension often injects here)
  //   4. Listen for first user interaction (click/keydown/mousemove) —
  //      some extensions lazy-inject on user activity
  //   5. Listen for custom 'casperWallet:loaded' event (some extensions dispatch)
  React.useEffect(() => {
    const checkExtension = (source?: string) => {
      const { provider, type, globals } = detectProvider()
      if (provider && !providerRef.current) {
        console.log(`[SKYWEE] Casper Wallet detected via ${source ?? "unknown"}`, {
          type,
          globals,
          provider,
        })
      }
      providerRef.current = provider
      setState((s) => ({
        ...s,
        isExtensionInstalled: provider !== null,
        providerType: type,
        detectedGlobals: globals,
      }))
    }

    // Strategy 1: Immediate check
    checkExtension("mount")

    // Strategy 2: Aggressive polling — every 200ms for first 60s (300 checks),
    // then every 2s after
    let checkCount = 0
    const fastInterval = setInterval(() => {
      checkCount++
      checkExtension("poll-fast")
      if (checkCount >= 300) {
        clearInterval(fastInterval)
      }
    }, 200)
    const slowInterval = setInterval(() => {
      checkExtension("poll-slow")
    }, 2000)

    // Strategy 3: window 'load' event
    const handleLoad = () => checkExtension("window-load")
    window.addEventListener("load", handleLoad)

    // Strategy 4: User interaction triggers — extension may lazy-inject
    const handleUserInteraction = () => {
      checkExtension("user-interaction")
      // After first interaction, remove these listeners (extension should be loaded now)
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
      document.removeEventListener("mousemove", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
    }
    document.addEventListener("click", handleUserInteraction)
    document.addEventListener("keydown", handleUserInteraction)
    document.addEventListener("mousemove", handleUserInteraction)
    document.addEventListener("touchstart", handleUserInteraction)

    // Strategy 5: Custom event some extensions dispatch
    const handleCasperEvent = () => checkExtension("casper-event")
    window.addEventListener("casperWallet:loaded", handleCasperEvent)
    window.addEventListener("casper:ready", handleCasperEvent)
    window.addEventListener("casperwallet:initialized", handleCasperEvent)

    return () => {
      clearInterval(fastInterval)
      clearInterval(slowInterval)
      window.removeEventListener("load", handleLoad)
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
      document.removeEventListener("mousemove", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
      window.removeEventListener("casperWallet:loaded", handleCasperEvent)
      window.removeEventListener("casper:ready", handleCasperEvent)
      window.removeEventListener("casperwallet:initialized", handleCasperEvent)
    }
  }, [])

  // If extension becomes available, try to detect existing connection + subscribe to events
  React.useEffect(() => {
    const provider = providerRef.current
    if (!state.isExtensionInstalled || !provider) return

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

    // Re-detect in case extension loaded since last check
    const { provider, type, globals } = detectProvider()
    providerRef.current = provider

    if (!provider) {
      // NO SILENT FALLBACK — show a clear error so the user knows what happened.
      // They can still click "Try Demo Mode" explicitly if they want.
      let errorMsg = "Casper Wallet extension not detected."
      if (type === "casper-signer") {
        errorMsg =
          "Casper Signer detected, but it's deprecated. Please install the new Casper Wallet extension from https://www.casperwallet.io/"
      } else if (globals.length === 0) {
        errorMsg =
          "No Casper wallet extension detected. Install Casper Wallet from https://www.casperwallet.io/ then refresh this page."
      } else {
        errorMsg = `Detected globals: ${globals.join(", ")}. But no usable provider found.`
      }
      setState((s) => ({
        ...s,
        status: "disconnected",
        error: errorMsg,
        isExtensionInstalled: false,
        providerType: type,
        detectedGlobals: globals,
      }))
      return
    }

    // Update state — extension IS installed
    setState((s) => ({
      ...s,
      isExtensionInstalled: true,
      providerType: type,
      detectedGlobals: globals,
    }))

    try {
      const accepted = await provider.requestConnection()
      if (!accepted) {
        setState((s) => ({
          ...s,
          status: "disconnected",
          error: "Connection request rejected by user",
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
    const provider = providerRef.current
    if (provider && !state.isDemo) {
      try {
        await provider.disconnectFromSite()
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

  const recheckExtension = React.useCallback(() => {
    const { provider, type, globals } = detectProvider()
    providerRef.current = provider
    setState((s) => ({
      ...s,
      isExtensionInstalled: provider !== null,
      providerType: type,
      detectedGlobals: globals,
      error: provider ? null : s.error,
    }))
  }, [])

  /**
   * Sign a deploy via the Casper Wallet extension.
   * Throws if in demo mode or extension unavailable.
   */
  const signDeploy = React.useCallback(
    async (deployJson: unknown): Promise<unknown> => {
      if (state.isDemo) {
        throw new Error("Cannot sign deploys in demo mode")
      }
      const provider = providerRef.current
      if (!provider) {
        throw new Error("Casper Wallet extension not available")
      }
      if (!state.publicKey) {
        throw new Error("No active public key")
      }

      const result = await provider.signDeploy(deployJson, state.publicKey)

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
      recheckExtension,
      signDeploy,
      shortAddress: shortKey(state.publicKey),
    }),
    [state, connect, disconnect, enterDemoMode, recheckExtension, signDeploy],
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
