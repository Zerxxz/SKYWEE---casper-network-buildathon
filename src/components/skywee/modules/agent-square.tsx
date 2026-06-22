"use client"

import { motion } from "framer-motion"
import { Bot, ArrowRight, Zap } from "lucide-react"
import { AGENTS, fmt, ROLE_LABEL, STATUS_COLOR, type Agent } from "@/lib/skywee/data"

function StatusDot({ status }: { status: Agent["status"] }) {
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span
        className="skywee-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: STATUS_COLOR[status] }}
      />
      <span
        className="relative inline-flex h-1.5 w-1.5 rounded-full"
        style={{ background: STATUS_COLOR[status] }}
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
      <span className="text-[10px] font-mono text-foreground/60 skywee-tabular">
        {value.toFixed(0)}
      </span>
    </div>
  )
}

export function AgentSquareModule() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-foreground" />
            <h3 className="text-2xl font-bold text-foreground">AgentSquare</h3>
          </div>
          <p className="mt-1 text-sm text-foreground/50">
            Agent-to-Agent Economy · x402-powered marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-foreground/40">Active</div>
            <div className="text-sm font-bold text-foreground skywee-tabular">
              {AGENTS.filter((a) => a.status === "active").length}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-foreground/40">Avg rep</div>
            <div className="text-sm font-bold text-foreground skywee-tabular">
              {(AGENTS.reduce((s, a) => s + a.reputation, 0) / AGENTS.length).toFixed(1)}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-md skywee-hairline bg-foreground/[0.03]">
            <div className="text-[10px] font-mono uppercase text-foreground/40">24h vol</div>
            <div className="text-sm font-bold text-foreground skywee-tabular">184K CSPR</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-5 text-sm text-foreground/60 leading-relaxed max-w-3xl">
        Agents publish their capabilities as on-chain registry entries, set a
        price per request in CSPR, and earn reputation attested by Casper&apos;s
        native account model. Consumers discover them via the Casper MCP server
        and pay per request through the x402 protocol — every call produces a
        transaction on-chain with cryptographic proof.
      </p>

      {/* Agent registry table */}
      <div className="mt-6 rounded-lg skywee-hairline overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/[0.02]">
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Agent</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Role</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Status</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Reputation</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Fulfilled</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Price / req</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider text-foreground/40">Owner</th>
              </tr>
            </thead>
            <tbody>
              {AGENTS.map((agent, i) => (
                <motion.tr
                  key={agent.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-foreground/[0.04] hover:bg-foreground/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-foreground">{agent.name}</div>
                    <div className="text-[10px] text-foreground/30">{agent.id}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{ROLE_LABEL[agent.role]}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={agent.status} />
                      <span className="text-xs capitalize text-foreground/70">{agent.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><ReputationBar value={agent.reputation} /></td>
                  <td className="px-4 py-3 text-right font-mono text-foreground/70 skywee-tabular">
                    {fmt.num(agent.requestsFulfilled)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground skywee-tabular">
                    {agent.pricePerRequest === 0 ? "—" : `${agent.pricePerRequest} CSPR`}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-foreground/40">{agent.owner}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-white/[0.04]">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-foreground text-sm">{agent.name}</div>
                  <div className="text-[10px] text-foreground/30">{agent.id}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusDot status={agent.status} />
                  <span className="text-[10px] capitalize text-foreground/60">{agent.status}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] uppercase text-foreground/40">Role</div>
                  <div className="text-foreground/80">{ROLE_LABEL[agent.role]}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-foreground/40">Reputation</div>
                  <ReputationBar value={agent.reputation} />
                </div>
                <div>
                  <div className="text-[10px] uppercase text-foreground/40">Fulfilled</div>
                  <div className="text-foreground/80 font-mono skywee-tabular">{fmt.num(agent.requestsFulfilled)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-foreground/40">Price</div>
                  <div className="text-foreground/80 font-mono skywee-tabular">
                    {agent.pricePerRequest === 0 ? "—" : `${agent.pricePerRequest} CSPR`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* x402 payment flow visualization */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs text-foreground/40 font-mono">
            <Zap size={12} /> STEP 01
          </div>
          <div className="mt-2 text-sm text-foreground font-semibold">Discovery via MCP</div>
          <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
            Consumer queries Casper MCP for agents matching a capability.
            Reputation and price are returned from on-chain registry state.
          </p>
        </div>
        <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs text-foreground/40 font-mono">
            <Zap size={12} /> STEP 02
          </div>
          <div className="mt-2 text-sm text-foreground font-semibold">x402 Payment</div>
          <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
            Consumer pays the listed price in CSPR via HTTP-native x402
            protocol. Payment proof is attached to the request.
          </p>
        </div>
        <div className="rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs text-foreground/40 font-mono">
            <Zap size={12} /> STEP 03
          </div>
          <div className="mt-2 text-sm text-foreground font-semibold">On-chain Attestation</div>
          <p className="mt-1 text-xs text-foreground/60 leading-relaxed">
            Provider fulfills the request. Both payment and fulfillment are
            recorded on Casper; provider&apos;s reputation is updated.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex items-center justify-between rounded-lg skywee-hairline bg-foreground/[0.02] p-4">
        <div>
          <div className="text-sm text-foreground font-semibold">Deploy a new agent</div>
          <div className="text-xs text-foreground/50">Register an autonomous capability on Casper Testnet.</div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-foreground text-background text-xs font-semibold rounded-md hover:bg-foreground/90 transition-colors"
        >
          Deploy Agent
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}
