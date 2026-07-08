/**
 * GET /api/skywee/account/[address]
 *   Returns all user-specific data: agents owned, transactions, balance, stats.
 */
import { NextRequest } from "next/server"
import { db, ensureSchema } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"
import { getAccountInfo } from "@/lib/skywee/cspr-cloud"
import { EXPLORER } from "@/lib/skywee/cspr-cloud"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    await ensureSchema(db)
    const { address } = await params
    if (!address) return err("address is required", 400)

    const accountInfo = await getAccountInfo(address)

    const agents = await db.agent.findMany({
      where: { ownerAddress: address },
      orderBy: { onChainId: "asc" },
    })

    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { callerAddr: address },
          { agent: { ownerAddress: address } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const policies = await db.policy.findMany({
      where: { policyholder: address },
      orderBy: { onChainId: "desc" },
    })

    const proposals = await db.proposal.findMany({
      where: { proposedBy: address },
      orderBy: { onChainId: "desc" },
    })

    const totalAgents = agents.length
    const activeAgents = agents.filter((a) => a.active).length
    const totalTransactions = transactions.length
    const totalPolicies = policies.length
    const totalProposals = proposals.length
    const avgReputation =
      agents.length > 0
        ? agents.reduce((s, a) => s + a.reputation, 0) / agents.length
        : 0

    return ok({
      address,
      shortAddress: `${address.slice(0, 6)}…${address.slice(-4)}`,
      explorerUrl: EXPLORER.account(address),
      balance: accountInfo.balanceCSPR,
      hasRealBalance: accountInfo.hasRealData,
      agents: { total: totalAgents, active: activeAgents, avgReputation, list: agents },
      transactions: { total: totalTransactions, list: transactions },
      policies: { total: totalPolicies, list: policies },
      proposals: { total: totalProposals, list: proposals },
    })
  } catch (e) {
    return err("Failed to fetch account data", 500, e instanceof Error ? e.message : String(e))
  }
}
