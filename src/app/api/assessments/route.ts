import { ensureReady } from "@/lib/server/bootstrap";
import { getAssessmentSummary } from "@/lib/server/queries";
import { serverError, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, assessments } = await ensureReady();
    return json(assessments.map((pkg) => getAssessmentSummary(db, pkg)));
  } catch (error) {
    console.error("[api/assessments] Failed to list assessments:", error);
    return serverError();
  }
}
