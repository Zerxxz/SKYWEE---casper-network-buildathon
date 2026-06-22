"use client"

import * as React from "react"
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
import { ActionModal, Field, inputCls, selectCls } from "../action-modal"
import { useWallet } from "@/lib/skywee/wallet"
import { useToast } from "@/hooks/use-toast"
import { VOLUME_SERIES } from "@/lib/skywee/data"

interface DbAsset {
  id: string
  onChainId: number
  name: string
  category: string
  totalValue: number
  tokenized: number
  holders: number
  apy: number
  ammPrice: number
  status: string
}

function fmtUsd(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toLocaleString()}`
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs">
      <div className="font-mono text-muted-foreground">{label}</div>
      <div className="font-bold skywee-tabular">
        {payload[0].value.toLocaleString()} CSPR
      </div>
    </div>
  )
}

export function RwaVaultModule() {
  const [assets, setAssets] = React.useState<DbAsset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const { publicKey, shortAddress } = useWallet()
  const { toast } = useToast()

  const [formName, setFormName] = React.useState("")
  const [formCategory, setFormCategory] = React.useState("Trade Finance")
  const [formValue, setFormValue] = React.useState("500000")
  const [formApy, setFormApy] = React.useState("8.5")

  const fetchAssets = React.useCallback(async () => {
    try {
      const res = await fetch("/api/skywee/rwa")
      const json = await res.json()
      if (json.ok) setAssets(json.data.assets)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const handleSubmit = async () => {
    if (!publicKey) throw new Error("Connect your wallet first")
    const res = await fetch("/api/skywee/rwa/fractionalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        category: formCategory,
        totalValue: parseFloat(formValue),
        apy: parseFloat(formApy),
        callerAddr: publicKey,
      }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Failed to fractionalize asset")
    return json.data
  }

  const handleSuccess = () => {
    setFormName("")
    setFormValue("500000")
    fetchAssets()
    toast({ title: "RWA fractionalized", description: "Your asset is now tokenized and live on the AMM." })
  }

  const totalAUM = assets.reduce((s, a) => s + a.totalValue, 0)
  const totalHolders = assets.reduce((s, a) => s + a.holders, 0)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} />
            <h3 className="text-2xl font-bold">RWA-X Vault</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Agent-Managed RWA AMM · Dutch auction issuance
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">AUM</div>
            <div className="text-sm font-bold skywee-tabular">{fmtUsd(totalAUM)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Assets</div>
            <div className="text-sm font-bold skywee-tabular">{assets.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Holders</div>
            <div className="text-sm font-bold skywee-tabular">{totalHolders.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        RWA-X Vault fractionalizes real-world assets — invoices, cargo
        receivables, government bonds, real-estate fractions — into Casper-native
        tokens. The market-maker agent MM-Aria runs Dutch auctions for new
        issuances and continuously rebalances the AMM curve based on demand
        forecasting.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                AMM Volume · last 24h
              </div>
              <div className="text-lg font-bold skywee-tabular">
                {VOLUME_SERIES.reduce((s, p) => s + p.volume, 0).toLocaleString()} CSPR
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp size={12} />
              <span className="text-foreground">+12.4%</span>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_SERIES} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "monospace" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="var(--foreground)"
                  strokeWidth={1.5}
                  fill="url(#volGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Market Maker Agent
          </div>
          <div className="flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="h-10 w-10 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center">
              <span className="text-xs font-mono text-muted-foreground">MM</span>
            </div>
            <div>
              <div className="text-sm font-semibold">MM-Aria</div>
              <div className="text-[10px] text-muted-foreground font-mono">reputation 94 · 8,204 reqs</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="skywee-pulse-dot h-1.5 w-1.5 rounded-full bg-foreground" />
              <span className="text-[10px] text-muted-foreground">active</span>
            </div>
          </div>
          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auctions today</span>
              <span className="font-mono skywee-tabular">14</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg fill time</span>
              <span className="font-mono skywee-tabular">38s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slippage (24h)</span>
              <span className="font-mono skywee-tabular">0.21%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IL exposure</span>
              <span className="font-mono skywee-tabular">$8,420</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last rebalance</span>
              <span className="font-mono skywee-tabular">3m ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assets table */}
      <div className="mt-5 rounded-lg skywee-hairline overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading assets…</div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-foreground/[0.02]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Asset</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Value</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Holders</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">APY</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">AMM Price</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a, i) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/40 hover:bg-foreground/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>{a.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">RWA-A{a.onChainId}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{a.category}</td>
                      <td className="px-4 py-3 text-right font-mono skywee-tabular">{fmtUsd(a.totalValue)}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground skywee-tabular">{a.holders.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono skywee-tabular">{a.apy.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-mono skywee-tabular">{a.ammPrice.toFixed(3)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-border/40">
              {assets.map((a) => (
                <div key={a.id} className="p-4">
                  <div className="text-sm">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">RWA-A{a.onChainId}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Category</div>
                      <div className="text-foreground/70">{a.category}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Value</div>
                      <div className="font-mono skywee-tabular">{fmtUsd(a.totalValue)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">APY</div>
                      <div className="font-mono skywee-tabular">{a.apy.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">AMM Price</div>
                      <div className="font-mono skywee-tabular">{a.ammPrice.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Fractionalize a new RWA</div>
          <div className="text-xs text-muted-foreground">
            {publicKey
              ? `Will be issued by ${shortAddress}`
              : "Connect wallet to mint Casper-native tokens backed by a real-world asset."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!publicKey) {
              toast({ title: "Connect wallet first", description: "Connect your Casper Wallet before fractionalizing an asset." })
              return
            }
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          Fractionalize Asset
          <ArrowRight size={12} />
        </button>
      </div>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Fractionalize RWA"
        description="Mint Casper-native tokens backed by a real-world asset"
        icon={<Layers size={16} />}
        onSubmit={handleSubmit}
        submitLabel="Fractionalize"
        successTitle="Asset fractionalized"
        successMessage="Your RWA is now tokenized on Casper Testnet. MM-Aria will open a Dutch auction shortly."
        onSuccess={handleSuccess}
      >
        <Field label="Asset Name" hint="A short description of the asset">
          <input
            className={inputCls}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Invoice — PT Maju Jaya"
            maxLength={80}
          />
        </Field>
        <Field label="Category">
          <select
            className={selectCls}
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
          >
            <option value="Trade Finance">Trade Finance</option>
            <option value="Logistics">Logistics</option>
            <option value="Government Bond">Government Bond</option>
            <option value="Property">Property</option>
            <option value="Invoice">Invoice</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Value (USD)">
            <input
              className={inputCls}
              type="number"
              min="0"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
            />
          </Field>
          <Field label="APY (%)">
            <input
              className={inputCls}
              type="number"
              step="0.1"
              min="0"
              value={formApy}
              onChange={(e) => setFormApy(e.target.value)}
            />
          </Field>
        </div>
      </ActionModal>
    </div>
  )
}
