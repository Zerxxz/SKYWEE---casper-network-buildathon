"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Users, ArrowRight, MessageSquare, Vote } from "lucide-react"
import { ActionModal, Field, inputCls, selectCls } from "../action-modal"
import { useWallet } from "@/lib/skywee/wallet"
import { useToast } from "@/hooks/use-toast"

interface DbDeliberation {
  id: string
  agentAddr: string
  agentRole: string
  message: string
  round: number
  blockHeight: number
}

interface DbProposal {
  id: string
  onChainId: number
  title: string
  proposedBy: string
  proposerRole: string
  amountCSPR: number
  votesFor: number
  votesAgainst: number
  deliberationRounds: number
  status: string
  deliberations: DbDeliberation[]
}

const ROLE_LABEL: Record<string, string> = {
  "yield-router": "Yield Router",
  "risk-scorer": "Risk Scorer",
  treasurer: "Treasurer",
  compliance: "Compliance",
  executor: "Executor",
}

const STATUS_BADGE: Record<string, string> = {
  voting: "bg-foreground/10 text-foreground border-border",
  executed: "bg-primary text-primary-foreground border-primary",
  rejected: "bg-foreground/[0.03] text-muted-foreground border-border/40 line-through",
}

function fmtCspr(n: number) {
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2)}M CSPR`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K CSPR`
      : `${n.toLocaleString()} CSPR`
}

export function SwarmTreasuryModule() {
  const [proposals, setProposals] = React.useState<DbProposal[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const { publicKey, shortAddress } = useWallet()
  const { toast } = useToast()

  const [formTitle, setFormTitle] = React.useState("")
  const [formAmount, setFormAmount] = React.useState("500000")
  const [formRole, setFormRole] = React.useState("yield-router")

  const fetchProposals = React.useCallback(async () => {
    try {
      const res = await fetch("/api/skywee/proposals")
      const json = await res.json()
      if (json.ok) setProposals(json.data.proposals)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleSubmit = async () => {
    if (!publicKey) throw new Error("Connect your wallet first")
    const res = await fetch("/api/skywee/proposals/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formTitle,
        amountCSPR: parseFloat(formAmount),
        proposedBy: publicKey,
        proposerRole: formRole,
      }),
    })
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || "Failed to create proposal")
    return json.data
  }

  const handleVote = async (proposalId: string, support: boolean) => {
    try {
      const res = await fetch(`/api/skywee/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          support,
          voterAddr: publicKey,
          voterRole: "treasurer",
          weight: 95000,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      toast({
        title: `Voted ${support ? "FOR" : "AGAINST"}`,
        description: json.data.autoExecuted
          ? "Auto-executed via 2-of-3 consensus."
          : "Vote recorded on-chain.",
      })
      fetchProposals()
    } catch (e) {
      toast({
        title: "Vote failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      })
    }
  }

  const handleSuccess = () => {
    setFormTitle("")
    setFormAmount("500000")
    fetchProposals()
    toast({ title: "Proposal created", description: "Your proposal is now open for swarm deliberation." })
  }

  const openProposals = proposals.filter((p) => p.status === "voting").length
  const executedProposals = proposals.filter((p) => p.status === "executed").length

  // Pick the first open proposal for the deliberation log
  const activeProposal = proposals.find((p) => p.status === "voting")
  const deliberations = activeProposal?.deliberations ?? []

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} />
            <h3 className="text-2xl font-bold">SwarmTreasury</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Multi-Agent DAO Execution · 4-agent consensus swarm
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Treasury</div>
            <div className="text-sm font-bold skywee-tabular">$8.41M</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Open</div>
            <div className="text-sm font-bold skywee-tabular">{openProposals}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Executed</div>
            <div className="text-sm font-bold skywee-tabular">{executedProposals}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        Four specialized agents — Yield Router, Risk Scorer, Compliance, and
        Treasurer — deliberate on every treasury action. Small actions
        auto-execute via 2-of-3 consensus; large actions become governance
        proposals. The full deliberation trail is written on-chain as an
        immutable audit log.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deliberation log */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-muted-foreground" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {activeProposal ? `Live Deliberation · PROP-${activeProposal.onChainId}` : "No open proposals"}
            </h4>
          </div>
          <div className="rounded-lg skywee-hairline bg-background/30 p-3 max-h-[420px] overflow-y-auto">
            <div className="space-y-3">
              {deliberations.length === 0 ? (
                <div className="text-xs text-muted-foreground py-8 text-center">
                  No deliberations yet.
                </div>
              ) : (
                deliberations.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-7 w-7 rounded-md skywee-hairline bg-foreground/[0.03] grid place-items-center">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {ROLE_LABEL[entry.agentRole]?.slice(0, 2) ?? "—"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-semibold">{ROLE_LABEL[entry.agentRole]}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">Round {entry.round}</span>
                        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">#{entry.blockHeight.toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {entry.message}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Proposals list */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-muted-foreground" />
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Treasury Proposals
            </h4>
          </div>
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Loading…</div>
            ) : proposals.map((p, i) => {
              const total = p.votesFor + p.votesAgainst
              const forPct = total > 0 ? (p.votesFor / total) * 100 : 0
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg skywee-hairline bg-foreground/[0.02] p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-muted-foreground">PROP-{p.onChainId}</div>
                      <div className="text-sm text-foreground font-medium leading-snug">{p.title}</div>
                    </div>
                    <span
                      className={[
                        "flex-shrink-0 px-2 py-0.5 text-[10px] font-mono uppercase rounded border",
                        STATUS_BADGE[p.status] ?? STATUS_BADGE.voting,
                      ].join(" ")}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>by <span className="text-foreground/70 font-mono">{ROLE_LABEL[p.proposerRole] ?? p.proposerRole}</span></span>
                    <span>·</span>
                    <span>{p.deliberationRounds} rounds</span>
                    <span>·</span>
                    <span className="font-mono skywee-tabular">{fmtCspr(p.amountCSPR)}</span>
                  </div>

                  {p.status === "voting" && (
                    <>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                          <span className="text-foreground/80">FOR {(p.votesFor / 1000).toFixed(0)}K</span>
                          <span>{forPct.toFixed(1)}%</span>
                          <span>AGAINST {(p.votesAgainst / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="h-1 rounded-full bg-foreground/10 overflow-hidden">
                          <div
                            className="h-full bg-foreground rounded-full"
                            style={{ width: `${forPct}%` }}
                          />
                        </div>
                      </div>
                      {publicKey && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleVote(p.id, true)}
                            className="flex-1 px-2 py-1.5 skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] rounded text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                          >
                            <Vote size={10} /> For
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVote(p.id, false)}
                            className="flex-1 px-2 py-1.5 skywee-hairline bg-foreground/[0.03] hover:bg-foreground/[0.07] rounded text-[10px] font-mono uppercase tracking-wider transition-colors"
                          >
                            Against
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Open new proposal</div>
          <div className="text-xs text-muted-foreground">
            {publicKey
              ? `Will be proposed by ${shortAddress}`
              : "Connect wallet to submit an action to the agent swarm."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!publicKey) {
              toast({ title: "Connect wallet first", description: "Connect your Casper Wallet before creating a proposal." })
              return
            }
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          New Proposal
          <ArrowRight size={12} />
        </button>
      </div>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Create Treasury Proposal"
        description="Submit an action to the agent swarm"
        icon={<Users size={16} />}
        onSubmit={handleSubmit}
        submitLabel="Create Proposal"
        successTitle="Proposal created"
        successMessage="The agent swarm will now deliberate on your proposal."
        onSuccess={handleSuccess}
      >
        <Field label="Proposer Role" hint="Your agent role in the swarm">
          <select
            className={selectCls}
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
          >
            <option value="yield-router">Yield Router</option>
            <option value="risk-scorer">Risk Scorer</option>
            <option value="treasurer">Treasurer</option>
            <option value="compliance">Compliance</option>
          </select>
        </Field>
        <Field label="Proposal Title" hint="A short description of the treasury action">
          <input
            className={inputCls}
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Rebalance 30% into CSPR.trade liquidity"
            maxLength={120}
          />
        </Field>
        <Field label="Amount (CSPR)" hint="Actions ≤ 1.5M CSPR may auto-execute on 2-of-3 consensus">
          <input
            className={inputCls}
            type="number"
            min="0"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />
        </Field>
      </ActionModal>
    </div>
  )
}
