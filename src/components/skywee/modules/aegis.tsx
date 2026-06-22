"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, Zap } from "lucide-react"
import { ActionModal, Field, inputCls, selectCls } from "../action-modal"
import { useWallet } from "@/lib/skywee/wallet"
import { useToast } from "@/hooks/use-toast"

interface DbPolicy {
  id: string
  onChainId: number
  rwaId: string
  rwaName: string
  trigger: string
  coverage: number
  premium: number
  policyholder: string
  monitorAddress: string
  status: string
  payoutEligible: boolean
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-foreground/10 text-foreground/70 border-border",
  triggered: "bg-primary text-primary-foreground border-primary",
  expired: "bg-foreground/[0.03] text-muted-foreground border-border/40",
}

function fmtUsd(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toLocaleString()}`
}

export function AegisModule() {
  const [policies, setPolicies] = React.useState<DbPolicy[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const { publicKey, shortAddress } = useWallet()
  const { toast } = useToast()

  const [formRwaName, setFormRwaName] = React.useState("")
  const [formTrigger, setFormTrigger] = React.useState("")
  const [formCoverage, setFormCoverage] = React.useState("100000")
  const [formPremium, setFormPremium] = React.useState("1500")
  const [formCategory, setFormCategory] = React.useState("Cargo")

  const fetchPolicies = React.useCallback(async () => {
    try {
      const res = await fetch("/api/skywee/policies")
      const json = await res.json()
      if (json.ok) setPolicies(json.data.policies)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleSubmit = async () => {
    if (!publicKey) throw new Error("Connect your wallet first")
    const res = await fetch("/api/skywee/policies/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rwaName: formRwaName,
        trigger: formTrigger,
        coverage: parseFloat(formCoverage),
        premium: parseFloat(formPremium),
        policyholder: publicKey,
      }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Failed to issue policy")
    return json.data
  }

  const handleTrigger = async (policyId: string) => {
    try {
      const res = await fetch(`/api/skywee/policies/${policyId}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caller: publicKey }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      toast({
        title: "Payout triggered",
        description: "ORC-12 monitoring agent executed the autonomous payout.",
      })
      fetchPolicies()
    } catch (e) {
      toast({
        title: "Failed to trigger",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    }
  }

  const handleSuccess = () => {
    setFormRwaName("")
    setFormTrigger("")
    fetchPolicies()
    toast({ title: "Policy issued", description: "Your RWA is now insured on Casper Testnet." })
  }

  const totalCoverage = policies.reduce((s, p) => s + p.coverage, 0)
  const totalPremium = policies.reduce((s, p) => s + p.premium, 0)
  const triggeredCount = policies.filter((p) => p.status === "triggered").length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} />
            <h3 className="text-2xl font-bold">Aegis</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Parametric Insurance for RWA · autonomous payout contracts
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Coverage</div>
            <div className="text-sm font-bold skywee-tabular">{fmtUsd(totalCoverage)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Premiums</div>
            <div className="text-sm font-bold skywee-tabular">{fmtUsd(totalPremium)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Triggered</div>
            <div className="text-sm font-bold skywee-tabular">{triggeredCount}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        Aegis wraps every tokenized RWA in a parametric insurance contract.
        The monitoring agent (ORC-12) continuously pulls off-chain data — GPS,
        weather, flight, IoT sensors — through x402-paid data APIs. When a
        trigger condition is met, the agent calls the payout contract directly.
        Settlement happens in seconds, fully on-chain, with no claims
        adjuster in the loop.
      </p>

      {triggeredCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-3 rounded-lg border border-foreground/30 bg-foreground/[0.06] p-3.5"
        >
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Triggered policies active — </span>
            <span className="text-muted-foreground">
              {triggeredCount} polic{triggeredCount === 1 ? "y" : "ies"} awaiting payout settlement.
            </span>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground">
            Loading policies…
          </div>
        ) : policies.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4 hover:bg-foreground/[0.04] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground">POL-{p.onChainId}</div>
                <div className="mt-0.5 text-sm font-semibold">{p.rwaName}</div>
              </div>
              <span
                className={[
                  "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border",
                  STATUS_BADGE[p.status] ?? STATUS_BADGE.active,
                ].join(" ")}
              >
                {p.status}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <Activity size={10} /> TRIGGER
            </div>
            <div className="mt-1 text-xs text-foreground/70 font-mono">{p.trigger}</div>

            <div className="mt-4 grid grid-cols-3 gap-3 pt-3 border-t border-border/60">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Coverage</div>
                <div className="text-sm font-bold skywee-tabular">{fmtUsd(p.coverage)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Premium</div>
                <div className="text-sm font-bold skywee-tabular">{fmtUsd(p.premium)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Monitor</div>
                <div className="text-sm font-mono text-foreground/70">ORC-12</div>
              </div>
            </div>

            {p.status === "active" && (
              <button
                type="button"
                onClick={() => handleTrigger(p.id)}
                className="mt-3 w-full px-3 py-2 skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] rounded-md text-[11px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
              >
                <Zap size={11} /> Simulate Trigger
              </button>
            )}
            {p.payoutEligible && (
              <div className="mt-3 px-3 py-2 rounded bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-between">
                <span>Payout eligible — auto-settling</span>
                <ArrowRight size={12} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Issue new policy</div>
          <div className="text-xs text-muted-foreground">
            {publicKey
              ? `Will be issued to ${shortAddress}`
              : "Connect wallet to wrap a tokenized RWA in parametric insurance."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!publicKey) {
              toast({ title: "Connect wallet first", description: "Connect your Casper Wallet before issuing a policy." })
              return
            }
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          Issue Policy
          <ArrowRight size={12} />
        </button>
      </div>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Issue Insurance Policy"
        description="Wrap a tokenized RWA in parametric insurance"
        icon={<ShieldCheck size={16} />}
        onSubmit={handleSubmit}
        submitLabel="Issue Policy"
        successTitle="Policy issued successfully"
        successMessage="Your RWA is now insured. The ORC-12 monitoring agent will watch for trigger conditions."
        onSuccess={handleSuccess}
      >
        <Field label="RWA Name" hint="A short description of the insured asset">
          <input
            className={inputCls}
            value={formRwaName}
            onChange={(e) => setFormRwaName(e.target.value)}
            placeholder="Cargo Container — IST→DXB"
            maxLength={80}
          />
        </Field>
        <Field label="Asset Category">
          <select
            className={selectCls}
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
          >
            <option value="Cargo">Cargo</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Flight">Flight Delay</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Trigger Condition" hint="The off-chain condition that triggers autonomous payout">
          <input
            className={inputCls}
            value={formTrigger}
            onChange={(e) => setFormTrigger(e.target.value)}
            placeholder="GPS deviation > 200km"
            maxLength={100}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Coverage (USD)">
            <input
              className={inputCls}
              type="number"
              min="0"
              value={formCoverage}
              onChange={(e) => setFormCoverage(e.target.value)}
            />
          </Field>
          <Field label="Premium (USD)">
            <input
              className={inputCls}
              type="number"
              min="0"
              value={formPremium}
              onChange={(e) => setFormPremium(e.target.value)}
            />
          </Field>
        </div>
        <div className="rounded-md skywee-hairline bg-foreground/[0.02] p-2.5 text-[10px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Policyholder</span>
            <span className="font-mono text-foreground/70">{shortAddress ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Monitoring Agent</span>
            <span className="font-mono text-foreground/70">ORC-12</span>
          </div>
        </div>
      </ActionModal>
    </div>
  )
}
