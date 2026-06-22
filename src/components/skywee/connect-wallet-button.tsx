"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, LogOut, Copy, Check, Zap, Wallet, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { useWallet } from "@/lib/skywee/wallet"
import { useAccountInfo } from "@/lib/skywee/use-network"
import { MagneticWrapper } from "./magnetic-wrapper"

export function ConnectWalletButton() {
  const { status, publicKey, shortAddress, isDemo, isExtensionInstalled, connect, disconnect } = useWallet()
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Fetch live account info from CSPR.cloud when connected
  const { account, loading: accountLoading } = useAccountInfo(publicKey, 15_000)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const isConnected = status === "connected" || status === "demo"

  const copyAddress = async () => {
    if (!publicKey) return
    try {
      await navigator.clipboard.writeText(publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore — clipboard not available
    }
  }

  if (!isConnected) {
    return (
      <MagneticWrapper strength={0.2} radius={5}>
        <button
          type="button"
          onClick={connect}
          disabled={status === "connecting"}
          className="group relative px-3.5 sm:px-4 py-2 rounded-md text-xs font-semibold skywee-hairline bg-foreground/[0.02] hover:bg-foreground/[0.06] backdrop-blur-md transition-all overflow-hidden disabled:opacity-60"
        >
          <span className="relative z-10 flex items-center gap-2">
            {status === "connecting" ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/60 skywee-pulse-dot" />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <Wallet size={12} className="text-foreground/60" />
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </>
            )}
          </span>
          <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent" />
        </button>
      </MagneticWrapper>
    )
  }

  // Balance display
  const balance = account?.balanceCSPR
  const balanceDisplay = accountLoading
    ? "Loading…"
    : balance !== null && balance !== undefined
      ? `${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} CSPR`
      : "—"

  return (
    <div className="relative" ref={menuRef}>
      <MagneticWrapper strength={0.15} radius={4}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group relative px-3 sm:px-3.5 py-2 rounded-md text-xs font-semibold skywee-hairline bg-foreground/[0.02] hover:bg-foreground/[0.06] backdrop-blur-md transition-all flex items-center gap-2"
      >
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            isDemo ? "bg-foreground/50" : "bg-foreground skywee-pulse-dot",
          ].join(" ")}
        />
        <span className="font-mono skywee-tabular">{shortAddress}</span>
        <ChevronDown
          size={12}
          className={["text-foreground/50 transition-transform", open ? "rotate-180" : ""].join(" ")}
        />
      </button>
      </MagneticWrapper>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 rounded-lg skywee-glass-strong p-2 z-50"
          >
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {isDemo ? "Demo Wallet" : "Casper Wallet"}
                </span>
                {isDemo ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground/10 text-foreground/60">
                    <Zap size={8} /> Demo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase rounded bg-foreground text-background">
                    Live
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-sm font-mono skywee-tabular break-all">
                {shortAddress}
              </div>
            </div>

            {/* Balance */}
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Network</span>
                <span className="font-mono">Casper Testnet</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-mono skywee-tabular flex items-center gap-1.5">
                  {accountLoading && <Loader2 size={10} className="animate-spin text-muted-foreground" />}
                  {balanceDisplay}
                </span>
              </div>
              {account?.hasRealData && (
                <div className="mt-1.5 text-[10px] text-muted-foreground/70 font-mono">
                  ✓ Live from CSPR.cloud
                </div>
              )}
            </div>

            {/* Extension hint */}
            {!isExtensionInstalled && (
              <div className="px-3 py-2 border-b border-border">
                <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Casper Wallet extension not detected. Running in demo
                    mode.{" "}
                    <a
                      href="https://www.casperwallet.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground"
                    >
                      Install ↗
                    </a>
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-1">
              <a
                href={account?.explorerUrl ?? `https://testnet.cspr.live/account/${publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs hover:bg-foreground/5 transition-colors"
              >
                <ExternalLink size={12} className="text-muted-foreground" />
                <span>View on cspr.live</span>
              </a>
              <button
                type="button"
                onClick={copyAddress}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs hover:bg-foreground/5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-foreground" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} className="text-muted-foreground" />
                    <span>Copy address</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  disconnect()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground"
              >
                <LogOut size={12} />
                <span>Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
