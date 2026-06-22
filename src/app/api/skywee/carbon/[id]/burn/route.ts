/**
 * POST /api/skywee/carbon/[id]/burn
 *
 * Body:
 *   amount: number (credits to burn)
 *   holderAddr: string
 *
 * Simulates `CarbonGuard::retire` — holder retires their own credits.
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
      amount?: number
      holderAddr?: string
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (typeof body.amount !== "number" || body.amount <= 0)
      return err("amount must be a positive number", 400)
    if (!body.holderAddr || typeof body.holderAddr !== "string")
      return err("holderAddr is required", 400)

    const project = await db.carbonProject.findUnique({ where: { id } })
    if (!project) return err("Project not found", 404)

    const available = project.creditsIssued - project.creditsRetired
    if (body.amount > available)
      return err(`Insufficient credits. Available: ${available}`, 400)

    await sleep(500)

    const updated = await db.carbonProject.update({
      where: { id },
      data: {
        creditsRetired: project.creditsRetired + body.amount,
        lastCheckBlock: currentBlock(),
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "carbon-guard",
        type: "credit-retired",
        agentName: "VER-Gaia",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.holderAddr,
        carbonProjectId: project.id,
        metadata: JSON.stringify({ amount: body.amount }),
      },
    })

    return ok({ project: updated, transaction: tx })
  } catch (e) {
    return err("Failed to burn credits", 500, e instanceof Error ? e.message : String(e))
  }
}
