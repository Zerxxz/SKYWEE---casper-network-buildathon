/**
 * POST /api/skywee/carbon/[id]/verify
 *
 * Body:
 *   pass: boolean (true = pass, false = flag)
 *   reason?: string
 *
 * Simulates `CarbonGuard::verify_project` (pass=true)
 * or `CarbonGuard::flag_project` (pass=false).
 *
 * When flagged, all unretired credits are burned.
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
      pass?: boolean
      reason?: string
      callerAddr?: string
    }>(req)

    if (!body || typeof body.pass !== "boolean")
      return err("pass (boolean) is required", 400)

    const project = await db.carbonProject.findUnique({ where: { id } })
    if (!project) return err("Project not found", 404)

    await sleep(700)

    let txType: string
    let newVerification: string
    let newCreditsRetired = project.creditsRetired
    let burnedAmount = 0

    if (body.pass) {
      txType = "verification-pass"
      newVerification = "verified"
    } else {
      txType = "verification-failed"
      newVerification = "flagged"
      // Burn all unretired credits
      burnedAmount = project.creditsIssued - project.creditsRetired
      newCreditsRetired = project.creditsIssued
    }

    const updated = await db.carbonProject.update({
      where: { id },
      data: {
        verification: newVerification,
        creditsRetired: newCreditsRetired,
        lastCheckBlock: currentBlock(),
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "carbon-guard",
        type: txType,
        agentName: "VER-Gaia",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.callerAddr ?? "0xf0381c9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a",
        carbonProjectId: project.id,
        metadata: JSON.stringify({
          pass: body.pass,
          reason: body.reason ?? null,
          burnedCredits: burnedAmount,
        }),
      },
    })

    // If we burned credits, also create a burn transaction
    if (burnedAmount > 0) {
      await db.transaction.create({
        data: {
          hash: generateTxHash(),
          module: "carbon-guard",
          type: "credit-burn",
          agentName: "VER-Gaia",
          amountCSPR: 0,
          status: "confirmed",
          blockHeight: currentBlock(),
          carbonProjectId: project.id,
          metadata: JSON.stringify({ amount: burnedAmount }),
        },
      })
    }

    return ok({
      project: updated,
      transaction: tx,
      burnedCredits: burnedAmount,
    })
  } catch (e) {
    return err("Failed to verify carbon project", 500, e instanceof Error ? e.message : String(e))
  }
}
