"use client"

import { motion } from "framer-motion"
import { Activity, Boxes, Network, Users, Globe, Clock, ExternalLink, Wifi } from "lucide-react"
import { useNetworkStatus } from "@/lib/skywee/use-network"
import { EXPLORER } from "@/lib/skywee/cspr-cloud"

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: typeof Activity
  label: string
  value: string
  hint?: string
  loading?: boolean
}) {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon size={10} />
        {label}
      </div>
      <div className="mt-1 text-sm font-bold skywee-tabular">
        {loading ? <span className="text-muted-foreground/50">…</span> : value}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</div>}
    </div>
  )
}

export function NetworkStatusWidget() {
  const { status, loading } = useNetworkStatus(10_000)

  const fmtSupply = (n: number | null) => {
    if (n === null) return "—"
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B CSPR`
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M CSPR`
    return `${n.toLocaleString()} CSPR`
  }

  const blockHeight = status?.blockHeight ?? 0
  const hasRealData = status?.hasRealData ?? false

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl skywee-glass p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center">
            <Network size={13} />
          </div>
          <div>
            <div className="text-sm font-semibold">Casper Network</div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {status?.network === "mainnet" ? "Mainnet" : "Testnet"} · Live Status
            </div>
          </div>
        </div>
        <a
          href={EXPLORER.block(blockHeight)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] text-[10px] font-mono uppercase tracking-wider transition-colors"
        >
          <ExternalLink size={10} />
          Explorer
        </a>
      </div>

      {/* Connection indicator */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-foreground/[0.03]">
        <Wifi
          size={11}
          className={loading ? "text-muted-foreground/50" : hasRealData ? "text-foreground" : "text-muted-foreground"}
        />
        <span className="text-[10px] font-mono">
          {loading
            ? "Connecting to CSPR.cloud…"
            : hasRealData
              ? "Live data from CSPR.cloud API"
              : "Cached data · Set CSPR_CLOUD_API_KEY for live"}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-border/40 rounded-lg overflow-hidden skywee-hairline">
        <Stat
          icon={Boxes}
          label="Block Height"
          value={`#${blockHeight.toLocaleString()}`}
          hint={status?.blockTimeSec ? `~${status.blockTimeSec}s blocks` : undefined}
          loading={loading}
        />
        <Stat
          icon={Clock}
          label="Era"
          value={status?.eraId !== null && status?.eraId !== undefined ? `#${status.eraId.toLocaleString()}` : "—"}
          loading={loading}
        />
        <Stat
          icon={Globe}
          label="Peers"
          value={status?.peerCount !== null && status?.peerCount !== undefined ? status.peerCount.toLocaleString() : "—"}
          loading={loading}
        />
        <Stat
          icon={Users}
          label="Validators"
          value={status?.validatorCount !== null && status?.validatorCount !== undefined ? status.validatorCount.toLocaleString() : "—"}
          loading={loading}
        />
      </div>

      {/* Block hash */}
      {status?.blockHash && (
        <div className="mt-3 px-3 py-2 rounded-md bg-foreground/[0.02] border border-border/60">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Latest Block Hash
          </div>
          <div className="text-[11px] font-mono break-all text-foreground/80">
            {status.blockHash}
          </div>
        </div>
      )}

      {/* Last updated */}
      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <Activity size={9} />
          {loading ? "Syncing…" : "Synced"}
        </span>
        <span>
          {status?.lastUpdated
            ? new Date(status.lastUpdated).toLocaleTimeString("en-US", { hour12: false })
            : "—"}
        </span>
      </div>
    </motion.div>
  )
}
