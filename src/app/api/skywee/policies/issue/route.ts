/**
 * POST /api/skywee/policies/issue
 *
 * Body:
 *   rwaName: string
 *   trigger: string
 *   coverage: number (USD)
 *   premium: number (USD)
 *   policyholder: string (wallet address)
 *
 * Simulates `InsuranceContract::issue_policy`.
 */
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      rwaName?: string
      trigger?: string
      coverage?: number
      premium?: number
      policyholder?: string
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (!body.rwaName || typeof body.rwaName !== "string")
      return err("rwaName is required", 400)
    if (!body.trigger || typeof body.trigger !== "string")
      return err("trigger is required", 400)
    if (typeof body.coverage !== "number" || body.coverage <= 0)
      return err("coverage must be a positive number", 400)
    if (typeof body.premium !== "number" || body.premium < 0)
      return err("premium must be a non-negative number", 400)
    if (!body.policyholder || typeof body.policyholder !== "string")
      return err("policyholder is required", 400)

    await sleep(800)

    const lastPolicy = await db.policy.findFirst({ orderBy: { onChainId: "desc" } })
    const onChainId = lastPolicy ? lastPolicy.onChainId + 1 : 7000

    // Default monitor address = ORC-12 (already-registered oracle agent)
    const monitorAddress = "0xab927f4c3b2a1d0e9f8a7b6c5d4e3f2a1b0c9d8e"

    const policy = await db.policy.create({
      data: {
        onChainId,
        rwaId: `RWA-${onChainId}`,
        rwaName: body.rwaName,
        trigger: body.trigger,
        coverage: body.coverage,
        premium: body.premium,
        policyholder: body.policyholder,
        monitorAddress,
        status: "active",
        payoutEligible: false,
        issuedBlock: currentBlock(),
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "aegis",
        type: "policy-issued",
        agentName: "ORC-12",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.policyholder,
        policyId: policy.id,
      },
    })

    return ok({ policy, transaction: tx }, 201)
  } catch (e) {
    return err("Failed to issue policy", 500, e instanceof Error ? e.message : String(e))
  }
}
