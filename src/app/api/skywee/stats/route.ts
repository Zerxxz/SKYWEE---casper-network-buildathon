/**
 * GET /api/skywee/stats
 *   Aggregated platform stats for the dashboard.
 */
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [
      agents,
      policies,
      proposals,
      rwaAssets,
      carbonProjects,
      transactions,
    ] = await Promise.all([
      db.agent.findMany(),
      db.policy.findMany(),
      db.proposal.findMany(),
      db.rwaAsset.findMany(),
      db.carbonProject.findMany(),
      db.transaction.count(),
    ])

    const activeAgents = agents.filter((a) => a.active).length
    const rwaAUM = rwaAssets.reduce((s, a) => s + a.totalValue, 0)
    const coverage = policies
      .filter((p) => p.status === "active")
      .reduce((s, p) => s + p.coverage, 0)
    const creditsIssued = carbonProjects.reduce((s, p) => s + p.creditsIssued, 0)
    const creditsRetired = carbonProjects.reduce((s, p) => s + p.creditsRetired, 0)
    const openProposals = proposals.filter((p) => p.status === "voting").length

    return ok({
      agents: { total: agents.length, active: activeAgents },
      rwa: { aum: rwaAUM, assetCount: rwaAssets.length },
      insurance: {
        activePolicies: policies.filter((p) => p.status === "active").length,
        coverage,
        triggeredPolicies: policies.filter((p) => p.status === "triggered").length,
      },
      treasury: {
        openProposals,
        executedProposals: proposals.filter((p) => p.status === "executed").length,
      },
      carbon: {
        creditsIssued,
        creditsRetired,
        projectCount: carbonProjects.length,
        flaggedProjects: carbonProjects.filter((p) => p.verification === "flagged").length,
      },
      transactions: { total: transactions },
      block: 2_847_195,
    })
  } catch (e) {
    return err("Failed to fetch stats", 500, e instanceof Error ? e.message : String(e))
  }
}
