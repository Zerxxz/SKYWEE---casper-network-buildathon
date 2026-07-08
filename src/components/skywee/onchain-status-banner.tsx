"use client"

import { useWallet } from "@/lib/skywee/wallet"
import { useNetworkStatus } from "@/lib/skywee/use-network"
import { Zap, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react"

/**
 * OnChainStatusBanner — prominent status indicator shown below the header.
 *
 * Shows:
 *   - LIVE mode (real Casper Wallet): green pulse + "ON-CHAIN" + real block height + explorer link
 *   - DEMO mode: amber warning + "DEMO MODE" + "Simulated transactions"
 *
 * The banner is always visible while inside the app (not on landing page).
 */
export function OnChainStatusBanner() {
  const { isDemo, isExtensionInstalled, publicKey, shortAddress } = useWallet()
  const { status: netStatus } = useNetworkStatus(15_000)

  const blockHeight = netStatus?.blockHeight ?? null
  const hasRealData = netStatus?.hasRealData ?? false

  if (isDemo) {
    // DEMO MODE banner — amber/warning style
    return (
      <div className="relative z-20 border-b border-foreground/20 bg-foreground/[0.06] backdrop-blur-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full bg-foreground/50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground/60" />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-foreground/70">
                Demo Mode
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/60 hidden sm:inline">
              · Simulated transactions — no real CSPR spent
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground/50 hidden md:inline">
              {shortAddress}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // LIVE mode banner — prominent, shows on-chain status
  return (
    <div className="relative z-20 border-b border-border bg-primary/[0.04] backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2">
        <div className="flex items-center gap-3">
          {/* Live badge */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full bg-primary" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-primary">
              On-Chain
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/60">
              · Casper Testnet
            </span>
          </div>

          {/* Block height */}
          {blockHeight !== null && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded skywee-hairline bg-foreground/[0.03]">
              <ShieldCheck size={9} className="text-muted-foreground" />
              <span className="text-[9px] font-mono text-muted-foreground">
                Block #{blockHeight.toLocaleString()}
              </span>
              {hasRealData && (
                <span className="text-[8px] font-mono text-primary">· LIVE</span>
              )}
            </div>
          )}

          {/* Real transactions label */}
          <span className="text-[10px] font-mono text-muted-foreground/50 hidden lg:inline">
            · Real signed deploys via Casper Wallet
          </span>
        </div>

        {/* Right side: wallet address + explorer link */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60 hidden md:inline">
            {shortAddress}
          </span>
          {publicKey && (
            <a
              href={`https://testnet.cspr.live/account/${publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Explorer <ExternalLink size={8} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
