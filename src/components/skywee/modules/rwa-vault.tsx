"use client"

import { motion } from "framer-motion"
import { Layers, ArrowRight, TrendingUp } from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { RWA_ASSETS, fmt, VOLUME_SERIES } from "@/lib/skywee/data"

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md bg-black/90 border border-white/15 px-2.5 py-1.5 text-xs">
      <div className="font-mono text-white/40">{label}</div>
      <div className="font-bold text-white skywee-tabular">
        {fmt.num(payload[0].value)} CSPR
      </div>
    </div>
  )
}

export function RwaVaultModule() {
  const totalAUM = RWA_ASSETS.reduce((s, a) => s + a.totalValue, 0)
  const totalHolders = RWA_ASSETS.reduce((s, a) => s + a.holders, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-white" />
            <h3 className="text-2xl font-bold text-white">RWA-X Vault</h3>
          </div>
          <p className="mt-1 text-sm text-white/50">
            Agent-Managed RWA AMM · Dutch auction issuance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">AUM</div>
            <div className="text-sm font-bold text-white skywee-tabular">{fmt.usd(totalAUM)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Assets</div>
            <div className="text-sm font-bold text-white skywee-tabular">{RWA_ASSETS.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-white/[0.03]">
            <div className="text-[10px] font-mono uppercase text-white/40">Holders</div>
            <div className="text-sm font-bold text-white skywee-tabular">{fmt.num(totalHolders)}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-3xl">
        RWA-X Vault fractionalizes real-world assets — invoices, cargo
        receivables, government bonds, real-estate fractions — into Casper-native
        tokens. The market-maker agent MM-Aria runs Dutch auctions for new
        issuances and continuously rebalances the AMM curve based on demand
        forecasting.
      </p>

      {/* Chart */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-lg skywee-hairline bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                AMM Volume · last 24h
              </div>
              <div className="text-lg font-bold text-white skywee-tabular">
                {fmt.num(VOLUME_SERIES.reduce((s, p) => s + p.volume, 0))} CSPR
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-white/50">
              <TrendingUp size={12} />
              <span className="text-white">+12.4%</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_SERIES} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.985 0 0)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.985 0 0)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "oklch(0.55 0 0)", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "oklch(1 0 0 / 0.05)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "oklch(0.55 0 0)", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="oklch(0.985 0 0)"
                  strokeWidth={1.5}
                  fill="url(#volGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market maker status */}
        <div className="lg:col-span-5 rounded-lg skywee-hairline bg-white/[0.02] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-3">
            Market Maker Agent
          </div>
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="h-10 w-10 rounded-md bg-white/5 border border-white/10 grid place-items-center">
              <span className="text-xs font-mono text-white/70">MM</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">MM-Aria</div>
              <div className="text-[10px] text-white/40 font-mono">reputation 94 · 8,204 reqs</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="skywee-pulse-dot h-1.5 w-1.5 rounded-full bg-white" />
              <span className="text-[10px] text-white/60">active</span>
            </div>
          </div>
          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/40">Auctions today</span>
              <span className="text-white font-mono skywee-tabular">14</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Avg fill time</span>
              <span className="text-white font-mono skywee-tabular">38s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Slippage (24h)</span>
              <span className="text-white font-mono skywee-tabular">0.21%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">IL exposure</span>
              <span className="text-white font-mono skywee-tabular">$8,420</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40">Last rebalance</span>
              <span className="text-white font-mono skywee-tabular">3m ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets table */}
      <div className="mt-5 rounded-lg skywee-hairline overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-white/40">Asset</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-white/40">Category</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-white/40">Value</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-white/40">Holders</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-white/40">APY</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-white/40">AMM Price</th>
              </tr>
            </thead>
            <tbody>
              {RWA_ASSETS.map((a, i) => (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-white">{a.name}</div>
                    <div className="text-[10px] text-white/30 font-mono">{a.id}</div>
                  </td>
                  <td className="px-4 py-3 text-white/60">{a.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-white skywee-tabular">{fmt.usd(a.totalValue)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70 skywee-tabular">{fmt.num(a.holders)}</td>
                  <td className="px-4 py-3 text-right font-mono text-white skywee-tabular">{a.apy.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right font-mono text-white skywee-tabular">
                    <span className={a.ammPrice >= 1 ? "text-white" : "text-white/60"}>
                      {a.ammPrice.toFixed(3)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {RWA_ASSETS.map((a) => (
            <div key={a.id} className="p-4">
              <div className="text-white text-sm">{a.name}</div>
              <div className="text-[10px] text-white/30 font-mono">{a.id}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] uppercase text-white/40">Category</div>
                  <div className="text-white/70">{a.category}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40">Value</div>
                  <div className="text-white font-mono skywee-tabular">{fmt.usd(a.totalValue)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40">APY</div>
                  <div className="text-white font-mono skywee-tabular">{a.apy.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40">AMM Price</div>
                  <div className="text-white font-mono skywee-tabular">{a.ammPrice.toFixed(3)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-white/[0.02] p-4">
        <div>
          <div className="text-sm text-white font-semibold">Fractionalize a new RWA</div>
          <div className="text-xs text-white/50">Mint Casper-native tokens backed by a real-world asset.</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-black text-xs font-semibold rounded-md hover:bg-white/90 transition-colors"
        >
          Fractionalize Asset
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}
