"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Leaf, ArrowRight, Satellite, AlertTriangle, Zap, Flame } from "lucide-react"
import { ActionModal, Field, inputCls, selectCls } from "../action-modal"
import { useWallet } from "@/lib/skywee/wallet"
import { useToast } from "@/hooks/use-toast"

interface DbProject {
  id: string
  onChainId: number
  name: string
  location: string
  projectType: string
  creditsIssued: number
  creditsRetired: number
  verification: string
  lastCheckBlock: number
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  verified: { label: "VERIFIED", cls: "bg-primary text-primary-foreground border-primary" },
  pending: { label: "PENDING", cls: "bg-foreground/10 text-foreground border-border" },
  flagged: { label: "FLAGGED", cls: "bg-foreground/[0.03] text-muted-foreground border-border/40" },
}

export function CarbonGuardModule() {
  const [projects, setProjects] = React.useState<DbProject[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const { publicKey, shortAddress } = useWallet()
  const { toast } = useToast()

  const [formName, setFormName] = React.useState("")
  const [formLocation, setFormLocation] = React.useState("")
  const [formType, setFormType] = React.useState("REDD+")
  const [formCredits, setFormCredits] = React.useState("10000")

  const fetchProjects = React.useCallback(async () => {
    try {
      const res = await fetch("/api/skywee/carbon")
      const json = await res.json()
      if (json.ok) setProjects(json.data.projects)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleSubmit = async () => {
    if (!publicKey) throw new Error("Connect your wallet first")
    const res = await fetch("/api/skywee/carbon/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        location: formLocation,
        projectType: formType,
        credits: parseFloat(formCredits),
        callerAddr: publicKey,
      }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Failed to register project")
    return json.data
  }

  const handleVerify = async (projectId: string, pass: boolean) => {
    try {
      const res = await fetch(`/api/skywee/carbon/${projectId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pass,
          reason: pass ? "Satellite NDVI within tolerance" : "Deforestation detected in latest imagery",
          callerAddr: publicKey,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      toast({
        title: pass ? "Verification passed" : "Project flagged",
        description: pass
          ? "Credits remain valid and tradeable."
          : `${json.data.burnedCredits.toLocaleString()} credits burned autonomously.`,
      })
      fetchProjects()
    } catch (e) {
      toast({
        title: "Verification failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    }
  }

  const handleBurn = async (projectId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId)
      if (!project) return
      const available = project.creditsIssued - project.creditsRetired
      if (available <= 0) {
        toast({ title: "No credits to retire", variant: "destructive" })
        return
      }
      const res = await fetch(`/api/skywee/carbon/${projectId}/burn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: available,
          holderAddr: publicKey,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      toast({
        title: "Credits retired",
        description: `${available.toLocaleString()} tCO₂e permanently burned on-chain.`,
      })
      fetchProjects()
    } catch (e) {
      toast({
        title: "Burn failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    }
  }

  const handleSuccess = () => {
    setFormName("")
    setFormLocation("")
    setFormCredits("10000")
    fetchProjects()
    toast({ title: "Project registered", description: "VER-Gaia will begin autonomous verification." })
  }

  const totalIssued = projects.reduce((s, p) => s + p.creditsIssued, 0)
  const totalRetired = projects.reduce((s, p) => s + p.creditsRetired, 0)
  const flaggedCount = projects.filter((p) => p.verification === "flagged").length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf size={18} />
            <h3 className="text-2xl font-bold">CarbonGuard</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous Carbon Verification · satellite + IoT attested
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Issued</div>
            <div className="text-sm font-bold skywee-tabular">{totalIssued.toLocaleString()} tCO₂e</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Retired</div>
            <div className="text-sm font-bold skywee-tabular">{totalRetired.toLocaleString()} tCO₂e</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Flagged</div>
            <div className="text-sm font-bold skywee-tabular">{flaggedCount}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        CarbonGuard tokenizes voluntary carbon credits as Casper-native RWA.
        The verification agent VER-Gaia continuously pulls satellite imagery
        and IoT sensor data through x402-paid data APIs. When projects fail
        verification — deforestation detected, sensor offline, biomass loss —
        the agent autonomously burns the corresponding credits on-chain,
        restoring trust in voluntary carbon markets.
      </p>

      {flaggedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-start gap-3 rounded-lg border border-foreground/30 bg-foreground/[0.06] p-3.5"
        >
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-semibold">Burn initiated — </span>
            <span className="text-muted-foreground">
              {flaggedCount} project{flaggedCount === 1 ? "" : "s"} flagged by satellite analysis.
              Credits queued for autonomous burn.
            </span>
          </div>
        </motion.div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground">Loading projects…</div>
        ) : projects.map((p, i) => {
          const retiredPct = p.creditsIssued > 0 ? (p.creditsRetired / p.creditsIssued) * 100 : 0
          const badge = STATUS_BADGE[p.verification] ?? STATUS_BADGE.pending
          const available = p.creditsIssued - p.creditsRetired
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4 hover:bg-foreground/[0.04] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center flex-shrink-0">
                    <Satellite size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground">CRB-{p.onChainId}</div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{p.location}</div>
                  </div>
                </div>
                <span
                  className={[
                    "flex-shrink-0 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded border",
                    badge.cls,
                  ].join(" ")}
                >
                  {badge.label}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="px-1.5 py-0.5 rounded bg-foreground/[0.04] border border-border">{p.projectType}</span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
                  <span>RETIRED</span>
                  <span className="text-foreground/70 skywee-tabular">
                    {p.creditsRetired.toLocaleString()} / {p.creditsIssued.toLocaleString()} tCO₂e
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded-full"
                    style={{ width: `${retiredPct}%` }}
                  />
                </div>
              </div>

              {/* Agent actions */}
              <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleVerify(p.id, true)}
                  className="px-2 py-1.5 skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] rounded text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                >
                  <Zap size={10} /> Verify
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(p.id, false)}
                  className="px-2 py-1.5 skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] rounded text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                >
                  <AlertTriangle size={10} /> Flag
                </button>
              </div>

              {available > 0 && p.verification === "verified" && (
                <button
                  type="button"
                  onClick={() => handleBurn(p.id)}
                  className="mt-2 w-full px-3 py-2 bg-foreground/[0.04] hover:bg-foreground/[0.08] rounded text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Flame size={11} /> Retire {available.toLocaleString()} credits
                </button>
              )}

              <div className="mt-2 text-[10px] text-muted-foreground/60 font-mono text-center">
                Last check: block #{p.lastCheckBlock.toLocaleString()}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Verification pipeline */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { step: "01", title: "Satellite pull", desc: "VER-Gaia fetches latest imagery via x402." },
          { step: "02", title: "Biomass delta", desc: "ML model computes NDVI delta vs baseline." },
          { step: "03", title: "On-chain attestation", desc: "Result posted as Casper contract event." },
          { step: "04", title: "Autonomous burn", desc: "If flagged, credits burned next block." },
        ].map((s) => (
          <div key={s.step} className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5">
            <div className="text-[10px] font-mono text-muted-foreground/60">{s.step}</div>
            <div className="mt-1 text-sm font-semibold">{s.title}</div>
            <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Register a carbon project</div>
          <div className="text-xs text-muted-foreground">
            {publicKey
              ? `Will be registered by ${shortAddress}`
              : "Connect wallet to tokenize credits and start autonomous verification."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!publicKey) {
              toast({ title: "Connect wallet first", description: "Connect your Casper Wallet before registering a project." })
              return
            }
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          Register Project
          <ArrowRight size={12} />
        </button>
      </div>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Register Carbon Project"
        description="Tokenize credits and start autonomous verification"
        icon={<Leaf size={16} />}
        onSubmit={handleSubmit}
        submitLabel="Register Project"
        successTitle="Project registered"
        successMessage="VER-Gaia will now begin autonomous satellite verification."
        onSuccess={handleSuccess}
      >
        <Field label="Project Name" hint="A short identifier for the project">
          <input
            className={inputCls}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Rimba Raya Biodiversity"
            maxLength={80}
          />
        </Field>
        <Field label="Location">
          <input
            className={inputCls}
            value={formLocation}
            onChange={(e) => setFormLocation(e.target.value)}
            placeholder="Central Kalimantan, ID"
            maxLength={80}
          />
        </Field>
        <Field label="Project Type">
          <select
            className={selectCls}
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
          >
            <option value="REDD+">REDD+ (Avoided Deforestation)</option>
            <option value="Renewable Energy">Renewable Energy</option>
            <option value="Blue Carbon">Blue Carbon</option>
            <option value="Afforestation">Afforestation</option>
            <option value="Energy Efficiency">Energy Efficiency</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Credits to Issue (tCO₂e)">
          <input
            className={inputCls}
            type="number"
            min="1"
            value={formCredits}
            onChange={(e) => setFormCredits(e.target.value)}
          />
        </Field>
      </ActionModal>
    </div>
  )
}
