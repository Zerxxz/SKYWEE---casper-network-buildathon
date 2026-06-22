/**
 * POST /api/skywee/carbon/register
 *
 * Body:
 *   name: string
 *   location: string
 *   projectType: string
 *   credits: number
 *   callerAddr: string
 *
 * Simulates `CarbonGuard::register_project`.
 */
import { db } from "@/lib/db"
import { ok, err, readJson, generateTxHash, currentBlock, sleep } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

const VALID_TYPES = new Set([
  "REDD+",
  "Renewable Energy",
  "Blue Carbon",
  "Afforestation",
  "Energy Efficiency",
  "Other",
])

export async function POST(req: Request) {
  try {
    const body = await readJson<{
      name?: string
      location?: string
      projectType?: string
      credits?: number
      callerAddr?: string
    }>(req)

    if (!body) return err("Missing JSON body", 400)
    if (!body.name || typeof body.name !== "string")
      return err("name is required", 400)
    if (!body.location || typeof body.location !== "string")
      return err("location is required", 400)
    if (!body.projectType || !VALID_TYPES.has(body.projectType))
      return err(`projectType must be one of: ${[...VALID_TYPES].join(", ")}`, 400)
    if (typeof body.credits !== "number" || body.credits <= 0)
      return err("credits must be a positive number", 400)
    if (!body.callerAddr || typeof body.callerAddr !== "string")
      return err("callerAddr is required", 400)

    await sleep(700)

    const last = await db.carbonProject.findFirst({ orderBy: { onChainId: "desc" } })
    const onChainId = last ? last.onChainId + 1 : 300

    const project = await db.carbonProject.create({
      data: {
        onChainId,
        name: body.name.trim(),
        location: body.location,
        projectType: body.projectType!,
        creditsIssued: body.credits!,
        creditsRetired: 0,
        verification: "pending",
        lastCheckBlock: currentBlock(),
      },
    })

    const tx = await db.transaction.create({
      data: {
        hash: generateTxHash(),
        module: "carbon-guard",
        type: "project-registered",
        agentName: "VER-Gaia",
        amountCSPR: 0,
        status: "confirmed",
        blockHeight: currentBlock(),
        callerAddr: body.callerAddr,
        carbonProjectId: project.id,
      },
    })

    return ok({ project, transaction: tx }, 201)
  } catch (e) {
    return err("Failed to register carbon project", 500, e instanceof Error ? e.message : String(e))
  }
}
