"use client"

import { Boxes, ExternalLink } from "lucide-react"
import { useNetworkStatus } from "@/lib/skywee/use-network"
import { EXPLORER } from "@/lib/skywee/cspr-cloud"

interface LiveBlockWidgetProps {
  /** Compact mode: icon-only, for collapsed sidebar */
  compact?: boolean
}

export function LiveBlockWidget({ compact = false }: LiveBlockWidgetProps) {
  const { status, loading } = useNetworkStatus(10_000)

  const blockHeight = status?.blockHeight ?? 2_847_195
  const eraId = status?.eraId
  const hasRealData = status?.hasRealData ?? false
  const network = status?.network ?? "testnet"

  if (compact) {
    // Compact: just an icon with tooltip + live dot
    return (
      <a
        href={EXPLORER.block(blockHeight)}
        target="_blank"
        rel="noopener noreferrer"
        className="h-8 w-8 rounded-md skywee-hairline bg-foreground/[0.02] hover:bg-foreground/[0.06] grid place-items-center transition-colors relative"
        title={`Block #${blockHeight.toLocaleString()} · ${network} · ${hasRealData ? "Live" : "Cached"}`}
      >
        <Boxes size={13} className="text-muted-foreground" />
        <span
          className={[
            "absolute top-1 right-1 h-1.5 w-1.5 rounded-full",
            loading ? "bg-muted-foreground/40" : "bg-foreground skywee-pulse-dot",
          ].join(" ")}
        />
      </a>
    )
  }

  return (
    <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Boxes size={10} />
          {network === "testnet" ? "Testnet Block" : "Mainnet Block"}
        </span>
        <a
          href={EXPLORER.block(blockHeight)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono skywee-tabular hover:text-foreground transition-colors flex items-center gap-0.5"
          title="View on cspr.live"
        >
          #{blockHeight.toLocaleString()}
          <ExternalLink size={8} className="opacity-50" />
        </a>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            loading ? "bg-muted-foreground/40" : "bg-foreground skywee-pulse-dot",
          ].join(" ")}
        />
        <span className="text-[10px] font-mono text-muted-foreground">
          {loading
            ? "Connecting…"
            : hasRealData
              ? `Live · Era ${eraId ?? "—"}`
              : "Cached · set CSPR_CLOUD_API_KEY for live"}
        </span>
      </div>
    </div>
  )
}
