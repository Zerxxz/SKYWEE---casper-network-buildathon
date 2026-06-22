/**
 * GET /api/skywee/carbon
 */
import { db } from "@/lib/db"
import { ok, err } from "@/lib/skywee/api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const projects = await db.carbonProject.findMany({
      orderBy: { onChainId: "asc" },
    })
    return ok({ projects, count: projects.length })
  } catch (e) {
    return err("Failed to fetch carbon projects", 500, e instanceof Error ? e.message : String(e))
  }
}
