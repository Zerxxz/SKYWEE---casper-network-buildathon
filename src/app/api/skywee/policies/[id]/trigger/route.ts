/**
 * POST /api/skywee/policies/[id]/trigger
 *
 * Simulates `InsuranceContract::trigger_payout`. Marks policy as triggered
 * and payoutEligible=true. In production this would be called by the
 * ORC-12 monitoring agent when the off-chain trigger condition is met.
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
    const body = await readJson<{ caller?: string }>(req)

    const policy = await db.policy.findUnique({ where: { id } })
    if (!policy) return err("Policy not found", 404)
    if (policy.status !== "active")
      return err(`Policy is not active (status: ${policy.status})`, 400)

    await sleep(600)

    const updated = await db.policy.update({
      where: { id },
      data: {
        status: "triggered",
        payoutEligible: true,
        payoutBlock: currentBlock(),
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "aegis",
        type: "policy-triggered",
        agentName: policy.monitorAddress === "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e" ? "ORC-12" : "Oracle",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body?.caller ?? policy.monitorAddress,
        policyId: policy.id,
        metadata: JSON.stringify({ payout: policy.coverage }),
      },
    })

    return ok({ policy: updated, transaction: tx })
  } catch (e) {
    return err("Failed to trigger policy", 500, e instanceof Error ? e.message : String(e))
  }
}
