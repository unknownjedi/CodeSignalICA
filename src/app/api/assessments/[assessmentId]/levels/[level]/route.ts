import { ensureReady } from "@/lib/server/bootstrap";
import { getLevelDetail } from "@/lib/server/queries";
import { getActiveSession, setSessionLastLevel } from "@/lib/assessments/repository";
import { badRequest, json, notFound, serverError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/assessments/[assessmentId]/levels/[level]">
) {
  try {
    const { assessmentId, level } = await ctx.params;
    const levelNumber = Number(level);
    if (!Number.isInteger(levelNumber) || levelNumber <= 0) {
      return badRequest("Level must be a positive integer.");
    }

    const { db, assessments } = await ensureReady();
    const pkg = assessments.find((assessment) => assessment.id === assessmentId);
    if (!pkg) {
      return notFound(`Unknown assessment: ${assessmentId}`);
    }
    const levelPkg = pkg.levels.find((candidate) => candidate.number === levelNumber);
    if (!levelPkg) {
      return notFound(`Unknown level: ${levelNumber}`);
    }

    const session = getActiveSession(db, pkg.id);
    if (session) {
      setSessionLastLevel(db, session.id, levelNumber);
    }

    return json(await getLevelDetail(db, pkg, levelPkg));
  } catch (error) {
    console.error("[api/levels/:level] Failed to load level:", error);
    return serverError();
  }
}
