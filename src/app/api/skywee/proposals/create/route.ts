/**
 * POST /api/skywee/proposals/create
 *
 * Body:
 *   title: string
 *   amountCSPR: number
 *   proposedBy: string (wallet address)
 *   proposerRole: string
 *
 * Simulates `TreasuryContract::create_proposal`.
 */
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

const VALID_ROLES = new Set([
  "yield-router",
  "risk-scorer",
  "treasurer",
  "compliance",
  "executor",
])

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      title?: string
      amountCSPR?: number
      proposedBy?: string
      proposerRole?: string
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0)
      return err("title is required", 400)
    if (typeof body.amountCSPR !== "number" || body.amountCSPR <= 0)
      return err("amountCSPR must be a positive number", 400)
    if (!body.proposedBy || typeof body.proposedBy !== "string")
      return err("proposedBy is required", 400)
    if (!body.proposerRole || !VALID_ROLES.has(body.proposerRole))
      return err(`proposerRole must be one of: ${[...VALID_ROLES].join(", ")}`, 400)

    await sleep(700)

    const lastProp = await db.proposal.findFirst({ orderBy: { onChainId: "desc" } })
    const onChainId = lastProp ? lastProp.onChainId + 1 : 500

    const proposal = await db.proposal.create({
      data: {
        onChainId,
        title: body.title.trim(),
        proposedBy: body.proposedBy,
        proposerRole: body.proposerRole,
        amountCSPR: body.amountCSPR,
        votesFor: 0,
        votesAgainst: 0,
        deliberationRounds: 0,
        status: "voting",
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "swarm-treasury",
        type: "proposal-created",
        agentName: body.proposerRole,
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.proposedBy,
        proposalId: proposal.id,
      },
    })

    return ok({ proposal, transaction: tx }, 201)
  } catch (e) {
    return err("Failed to create proposal", 500, e instanceof Error ? e.message : String(e))
  }
}
