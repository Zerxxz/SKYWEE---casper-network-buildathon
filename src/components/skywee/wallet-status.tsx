"use client"

import { Wallet, Zap, Link2 } from "lucide-react"
import { useWallet } from "@/lib/skywee/wallet"

interface WalletStatusProps {
  /** Compact mode: icon-only, for collapsed sidebar */
  compact?: boolean
}

export function WalletStatus({ compact = false }: WalletStatusProps) {
  const { status, shortAddress, isDemo, isExtensionInstalled, connect } = useWallet()

  const isConnected = status === "connected" || status === "demo"

  if (compact) {
    // Compact: just a wallet icon with status dot
    if (isConnected) {
      return (
        <div
          className="h-8 w-8 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center relative cursor-default"
          title={`Connected: ${shortAddress}${isDemo ? " (demo)" : ""}`}
        >
          <Wallet size={13} className="text-foreground/70" />
          <span
            className={[
              "absolute top-1 right-1 h-1.5 w-1.5 rounded-full",
              isDemo ? "bg-foreground/50" : "bg-foreground skywee-pulse-dot",
            ].join(" ")}
          />
        </div>
      )
    }
    return (
      <button
        type="button"
        onClick={connect}
        className="h-8 w-8 rounded-md skywee-hairline bg-foreground/[0.02] hover:bg-foreground/[0.06] grid place-items-center transition-colors"
        title={isExtensionInstalled ? "Click to connect" : "Demo mode available"}
      >
        <Link2 size={13} className="text-muted-foreground" />
      </button>
    )
  }

  if (isConnected) {
    return (
      <div className="rounded-lg skywee-hairline bg-foreground/[0.03] p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Wallet size={10} /> Wallet
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
        <div className="font-mono text-xs skywee-tabular truncate">{shortAddress}</div>
        <div className="mt-1 text-[10px] text-muted-foreground">Casper Testnet</div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={connect}
      className="w-full rounded-lg skywee-hairline bg-foreground/[0.02] hover:bg-foreground/[0.05] p-3 transition-colors text-left"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Link2 size={10} /> Not Connected
        </span>
      </div>
      <div className="text-xs text-foreground/80">
        {isExtensionInstalled ? "Click to connect" : "Demo mode available"}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        {isExtensionInstalled
          ? "Casper Wallet detected"
          : "No extension — will use demo"}
      </div>
    </button>
  )
}
