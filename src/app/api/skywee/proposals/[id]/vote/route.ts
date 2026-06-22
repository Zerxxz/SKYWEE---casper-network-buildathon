/**
 * POST /api/skywee/proposals/[id]/vote
 *
 * Body:
 *   support: boolean
 *   voterAddr: string
 *   voterRole: string
 *   weight?: number (defaults to 95_000 — reputation 95 × 1000)
 *
 * Simulates `TreasuryContract::vote`.
 */
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await readJson<{
      support?: boolean
      voterAddr?: string
      voterRole?: string
      weight?: number
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (typeof body.support !== "boolean")
      return err("support must be a boolean", 400)
    if (!body.voterAddr || typeof body.voterAddr !== "string")
      return err("voterAddr is required", 400)

    const proposal = await db.proposal.findUnique({ where: { id } })
    if (!proposal) return err("Proposal not found", 404)
    if (proposal.status !== "voting")
      return err(`Proposal is not in voting phase (status: ${proposal.status})`, 400)

    await sleep(500)

    const weight = body.weight ?? 95_000 // reputation 95 × 1000
    const votesFor = proposal.votesFor + (body.support ? weight : 0)
    const votesAgainst = proposal.votesAgainst + (body.support ? 0 : weight)

    const updated = await db.proposal.update({
      where: { id },
      data: { votesFor, votesAgainst },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "swarm-treasury",
        type: "proposal-vote",
        agentName: body.voterRole ?? "Swarm Agent",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.voterAddr,
        proposalId: proposal.id,
        metadata: JSON.stringify({ support: body.support, weight }),
      },
    })

    // Auto-execute simulation: if FOR votes > 5,000,000 and total > 7,500,000,
    // mark as executed (mimicking 2-of-3 consensus threshold).
    const totalVotes = votesFor + votesAgainst
    if (updated.amountCSPR <= 1_500_000 && votesFor > 5_000_000 && totalVotes > 7_500_000) {
      const executed = await db.proposal.update({
        where: { id },
        data: { status: "executed" },
      })
      return ok({
        proposal: executed,
        transaction: tx,
        autoExecuted: true,
        message: "Auto-executed via 2-of-3 consensus.",
      })
    }

    return ok({ proposal: updated, transaction: tx, autoExecuted: false })
  } catch (e) {
    return err("Failed to vote on proposal", 500, e instanceof Error ? e.message : String(e))
  }
}
