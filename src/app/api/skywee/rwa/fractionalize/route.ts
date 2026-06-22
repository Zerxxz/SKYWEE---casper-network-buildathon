/**
 * POST /api/skywee/rwa/fractionalize
 *
 * Body:
 *   name: string
 *   category: string
 *   totalValue: number (USD)
 *   apy: number (percent, e.g. 11.4)
 *   callerAddr: string
 *
 * Simulates `RwaVault::fractionalize`.
 */
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

const VALID_CATEGORIES = new Set([
  "Trade Finance",
  "Logistics",
  "Government Bond",
  "Property",
  "Invoice",
  "Other",
])

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      name?: string
      category?: string
      totalValue?: number
      apy?: number
      callerAddr?: string
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (!body.name || typeof body.name !== "string")
      return err("name is required", 400)
    if (!body.category || !VALID_CATEGORIES.has(body.category))
      return err(`category must be one of: ${[...VALID_CATEGORIES].join(", ")}`, 400)
    if (typeof body.totalValue !== "number" || body.totalValue <= 0)
      return err("totalValue must be a positive number", 400)
    if (typeof body.apy !== "number" || body.apy < 0)
      return err("apy must be a non-negative number", 400)
    if (!body.callerAddr || typeof body.callerAddr !== "string")
      return err("callerAddr is required", 400)

    await sleep(800)

    const last = await db.rwaAsset.findFirst({ orderBy: { onChainId: "desc" } })
    const onChainId = last ? last.onChainId + 1 : 1000

    const asset = await db.rwaAsset.create({
      data: {
        onChainId,
        name: body.name.trim(),
        category: body.category!,
        totalValue: body.totalValue!,
        tokenized: body.totalValue!,
        holders: 1,
        apy: body.apy!,
        ammPrice: 1.0,
        status: "active",
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "rwa-vault",
        type: "fractionalize",
        agentName: "MM-Aria",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.callerAddr,
        rwaAssetId: asset.id,
      },
    })

    return ok({ asset, transaction: tx }, 201)
  } catch (e) {
    return err("Failed to fractionalize asset", 500, e instanceof Error ? e.message : String(e))
  }
}
