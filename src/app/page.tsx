import { ensureReady } from "@/lib/server/bootstrap";
import { getAssessmentSummary } from "@/lib/server/queries";
import AssessmentList from "@/components/assessment/AssessmentList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { db, assessments } = await ensureReady();
  const summaries = assessments.map((pkg) => getAssessmentSummary(db, pkg));

  return (
    <main className="min-h-screen">
      <AssessmentList assessments={summaries} />
    </main>
  );
}
