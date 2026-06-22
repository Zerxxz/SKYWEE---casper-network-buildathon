"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Bot, ArrowRight, Zap } from "lucide-react"
import { ActionModal, Field, inputCls, selectCls } from "../action-modal"
import { McpDiscoveryPanel } from "../mcp-discovery-panel"
import { useWallet } from "@/lib/skywee/wallet"
import { useDeploySubmit, useCanSignDeploys } from "@/lib/skywee/use-deploy-submit"
import { useToast } from "@/hooks/use-toast"

interface DbAgent {
  id: string
  onChainId: number
  name: string
  role: string
  ownerAddress: string
  pricePerRequest: number
  reputation: number
  requestsFulfilled: number
  active: boolean
  module: string
}

const ROLE_LABEL: Record<string, string> = {
  "risk-scorer": "Risk Scorer",
  "yield-router": "Yield Router",
  compliance: "Compliance",
  executor: "Executor",
  oracle: "Oracle",
  "market-maker": "Market Maker",
  verifier: "Verifier",
  treasurer: "Treasurer",
}

const STATUS_COLOR: Record<string, string> = {
  active: "oklch(0.95 0 0)",
  idle: "oklch(0.55 0 0)",
  executing: "oklch(0.985 0 0)",
  deliberating: "oklch(0.75 0 0)",
}

function StatusDot({ active }: { active: boolean }) {
  const color = active ? "var(--foreground)" : "var(--muted-foreground)"
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span
        className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
    </span>
  )
}

function ReputationBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground skywee-tabular">
        {value.toFixed(0)}
      </span>
    </div>
  )
}

export function AgentSquareModule() {
  const [agents, setAgents] = React.useState<DbAgent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const { publicKey, isDemo, shortAddress } = useWallet()
  const deploySubmit = useDeploySubmit()
  const canSignDeploys = useCanSignDeploys()
  const { toast } = useToast()

  // Form state
  const [formName, setFormName] = React.useState("")
  const [formRole, setFormRole] = React.useState("risk-scorer")
  const [formPrice, setFormPrice] = React.useState("0.42")

  const fetchAgents = React.useCallback(async () => {
    try {
      const res = await fetch("/api/skywee/agents")
      const json = await res.json()
      if (json.ok) setAgents(json.data.agents)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleSubmit = async () => {
    if (!publicKey) throw new Error("Connect your wallet first")

    // Attempt real Casper deploy first (when wallet extension available)
    const result = await deploySubmit({
      module: "agent_registry",
      entryPoint: "register_agent",
      args: {
        name: formName,
        role: formRole,
        price_per_request: parseFloat(formPrice) || 0,
      },
      onBroadcastSuccess: async () => {
        // After deploy is broadcast (or simulated), call our DB-writing API
        // to record the agent in the local DB.
        const res = await fetch("/api/skywee/agents/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            role: formRole,
            pricePerRequest: parseFloat(formPrice) || 0,
            ownerAddress: publicKey,
          }),
        })
        const json = await res.json()
        if (!json.ok) throw new Error(json.error || "Failed to deploy agent")
        return json.data
      },
    })

    return {
      hash: result.hash,
      explorerUrl: result.explorerUrl,
      broadcast: result.broadcast,
      ...(result.data as object),
    }
  }

  const handleSuccess = () => {
    setFormName("")
    setFormPrice("0.42")
    fetchAgents()
    toast({ title: "Agent deployed", description: "Your agent is now live on Casper Testnet." })
  }

  const activeCount = agents.filter((a) => a.active).length
  const avgRep = agents.length > 0
    ? agents.reduce((s, a) => s + a.reputation, 0) / agents.length
    : 0
  const totalFulfilled = agents.reduce((s, a) => s + a.requestsFulfilled, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={18} />
            <h3 className="text-2xl font-bold">AgentSquare</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Agent-to-Agent Economy · x402-powered marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Active</div>
            <div className="text-sm font-bold skywee-tabular">{activeCount}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Avg rep</div>
            <div className="text-sm font-bold skywee-tabular">{avgRep.toFixed(1)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Fulfilled</div>
            <div className="text-sm font-bold skywee-tabular">{totalFulfilled.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-3xl">
        Agents publish their capabilities as on-chain registry entries, set a
        price per request in CSPR, and earn reputation attested by Casper&apos;s
        native account model. Consumers discover them via the Casper MCP server
        and pay per request through the x402 protocol — every call produces a
        transaction on-chain with cryptographic proof.
      </p>

      {/* Agent registry table */}
      <div className="mt-6 rounded-lg skywee-hairline overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading agents from Casper Testnet…
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-foreground/[0.02]">
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Agent</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Reputation</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Fulfilled</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Price / req</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent, i) => (
                    <motion.tr
                      key={agent.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/40 hover:bg-foreground/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-mono">{agent.name}</div>
                        <div className="text-[10px] text-muted-foreground">AGT-{String(agent.onChainId).padStart(3, "0")}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{ROLE_LABEL[agent.role] ?? agent.role}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusDot active={agent.active} />
                          <span className="text-xs capitalize text-muted-foreground">{agent.active ? "active" : "idle"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><ReputationBar value={agent.reputation} /></td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground skywee-tabular">
                        {agent.requestsFulfilled.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono skywee-tabular">
                        {agent.pricePerRequest === 0 ? "—" : `${agent.pricePerRequest} CSPR`}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                        {agent.ownerAddress.slice(0, 6)}…{agent.ownerAddress.slice(-4)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/40">
              {agents.map((agent) => (
                <div key={agent.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-sm">{agent.name}</div>
                      <div className="text-[10px] text-muted-foreground">AGT-{String(agent.onChainId).padStart(3, "0")}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusDot active={agent.active} />
                      <span className="text-[10px] capitalize text-muted-foreground">{agent.active ? "active" : "idle"}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Role</div>
                      <div className="text-foreground/80">{ROLE_LABEL[agent.role] ?? agent.role}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Reputation</div>
                      <ReputationBar value={agent.reputation} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Fulfilled</div>
                      <div className="text-foreground/80 font-mono skywee-tabular">{agent.requestsFulfilled.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Price</div>
                      <div className="text-foreground/80 font-mono skywee-tabular">
                        {agent.pricePerRequest === 0 ? "—" : `${agent.pricePerRequest} CSPR`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* x402 payment flow visualization */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { step: "01", title: "Discovery via MCP", desc: "Consumer queries Casper MCP for agents matching a capability. Reputation and price are returned from on-chain registry state." },
          { step: "02", title: "x402 Payment", desc: "Consumer pays the listed price in CSPR via HTTP-native x402 protocol. Payment proof is attached to the request." },
          { step: "03", title: "On-chain Attestation", desc: "Provider fulfills the request. Both payment and fulfillment are recorded on Casper; provider's reputation is updated." },
        ].map((s) => (
          <div key={s.step} className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Zap size={12} /> STEP {s.step}
            </div>
            <div className="mt-2 text-sm text-foreground font-semibold">{s.title}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* MCP Discovery Panel */}
      <McpDiscoveryPanel />

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Deploy a new agent</div>
          <div className="text-xs text-muted-foreground">
            {publicKey
              ? `Will be registered to ${shortAddress}${isDemo ? " (demo)" : ""}`
              : "Connect wallet to register an autonomous capability on Casper Testnet."}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!publicKey) {
              toast({ title: "Connect wallet first", description: "You need to connect your Casper Wallet before deploying an agent." })
              return
            }
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          Deploy Agent
          <ArrowRight size={12} />
        </button>
      </div>

      <ActionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Deploy New Agent"
        description="Register an autonomous agent on Casper Testnet"
        icon={<Bot size={16} />}
        onSubmit={handleSubmit}
        submitLabel="Deploy Agent"
        deployMode={canSignDeploys ? "live" : "simulation"}
        successTitle="Agent deployed successfully"
        successMessage="Your agent is now registered on-chain and discoverable via Casper MCP."
        onSuccess={handleSuccess}
      >
        <Field label="Agent Name" hint="A short identifier for your agent (e.g. RYSK-7)">
          <input
            className={inputCls}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="RYSK-8"
            maxLength={20}
          />
        </Field>
        <Field label="Agent Role" hint="Determines which module your agent can serve">
          <select
            className={selectCls}
            value={formRole}
            onChange={(e) => setFormRole(e.target.value)}
          >
            <option value="risk-scorer">Risk Scorer</option>
            <option value="yield-router">Yield Router</option>
            <option value="compliance">Compliance</option>
            <option value="executor">Executor</option>
            <option value="oracle">Oracle</option>
            <option value="market-maker">Market Maker</option>
            <option value="verifier">Verifier</option>
            <option value="treasurer">Treasurer</option>
          </select>
        </Field>
        <Field label="Price per Request (CSPR)" hint="0 = service agent (free for swarm members)">
          <input
            className={inputCls}
            type="number"
            step="0.01"
            min="0"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
          />
        </Field>
        <div className="rounded-md skywee-hairline bg-foreground/[0.02] p-2.5 text-[10px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Owner</span>
            <span className="font-mono text-foreground/70">{shortAddress ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Initial reputation</span>
            <span className="font-mono text-foreground/70">50 / 100</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Network</span>
            <span className="font-mono text-foreground/70">Casper Testnet</span>
          </div>
        </div>
      </ActionModal>
    </div>
  )
}
