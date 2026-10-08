import { z } from "zod";
import { ensureReady } from "@/lib/server/bootstrap";
import { startSession } from "@/lib/assessments/repository";
import { buildSessionDto } from "@/lib/server/queries";
import { badRequest, json, notFound, serverError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["practice", "assessment"]),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/assessments/[assessmentId]/start">
) {
  try {
    const { assessmentId } = await ctx.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return badRequest('Request body must be { mode: "practice" | "assessment" }.');
    }

    const { db, assessments } = await ensureReady();
    const pkg = assessments.find((assessment) => assessment.id === assessmentId);
    if (!pkg) {
      return notFound(`Unknown assessment: ${assessmentId}`);
    }

    const session = startSession(
      db,
      pkg.id,
      parsed.data.mode,
      pkg.durationMinutes
    );
    return json(buildSessionDto(session));
  } catch (error) {
    console.error("[api/start] Failed to start session:", error);
    return serverError();
  }
}
