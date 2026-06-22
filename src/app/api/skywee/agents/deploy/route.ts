/**
 * POST /api/skywee/agents/deploy
 *
 * Body:
 *   name: string
 *   role: string (risk-scorer | yield-router | compliance | executor | oracle | market-maker | verifier | treasurer)
 *   pricePerRequest: number (CSPR)
 *   ownerAddress: string (caller wallet address)
 *
 * Simulates the Odra `AgentRegistry::register_agent` contract call.
 * Inserts a new Agent row, creates a Transaction record, returns the agent.
 */
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

const VALID_ROLES = new Set([
  "risk-scorer",
  "yield-router",
  "compliance",
  "executor",
  "oracle",
  "market-maker",
  "verifier",
  "treasurer",
])

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      name?: string
      role?: string
      pricePerRequest?: number
      ownerAddress?: string
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0)
      return err("name is required", 400)
    if (!body.role || !VALID_ROLES.has(body.role))
      return err(`role must be one of: ${[...VALID_ROLES].join(", ")}`, 400)
    if (typeof body.pricePerRequest !== "number" || body.pricePerRequest < 0)
      return err("pricePerRequest must be a non-negative number", 400)
    if (!body.ownerAddress || typeof body.ownerAddress !== "string")
      return err("ownerAddress is required", 400)

    // Simulate deploy latency
    await sleep(700)

    // Get next on-chain ID
    const lastAgent = await db.agent.findFirst({ orderBy: { onChainId: "desc" } })
    const onChainId = lastAgent ? lastAgent.onChainId + 1 : 1

    const agent = await db.agent.create({
      data: {
        onChainId,
        name: body.name.trim(),
        role: body.role!,
        ownerAddress: body.ownerAddress!,
        pricePerRequest: body.pricePerRequest!,
        reputation: 50,
        requestsFulfilled: 0,
        active: true,
        module: "agent-square",
        registeredBlock: currentBlock(),
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "agent-square",
        type: "agent-registered",
        agentName: agent.name,
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.ownerAddress,
        agentId: agent.id,
      },
    })

    return ok({ agent, transaction: tx }, 201)
  } catch (e) {
    return err("Failed to deploy agent", 500, e instanceof Error ? e.message : String(e))
  }
}
