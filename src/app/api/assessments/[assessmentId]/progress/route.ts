import { ensureReady } from "@/lib/server/bootstrap";
import { getAssessmentSummary } from "@/lib/server/queries";
import { json, notFound, serverError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/assessments/[assessmentId]/progress">
) {
  try {
    const { assessmentId } = await ctx.params;
    const { db, assessments } = await ensureReady();
    const pkg = assessments.find((assessment) => assessment.id === assessmentId);
    if (!pkg) {
      return notFound(`Unknown assessment: ${assessmentId}`);
    }
    return json(getAssessmentSummary(db, pkg));
  } catch (error) {
    console.error("[api/progress] Failed to load progress:", error);
    return serverError();
  }
}
