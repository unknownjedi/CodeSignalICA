import { notFound } from "next/navigation";
import { ensureReady } from "@/lib/server/bootstrap";
import { getAssessmentSummary, getLevelDetail } from "@/lib/server/queries";
import { getOrSeedFiles } from "@/lib/assessments/repository";
import AssessmentWorkspace from "@/components/assessment/AssessmentWorkspace";
import type { CodeResponseDto } from "@/lib/api-types";

export const dynamic = "force-dynamic";

export default async function AssessmentPage(
  props: PageProps<"/assessments/[assessmentId]">
) {
  const { assessmentId } = await props.params;
  const { db, assessments } = await ensureReady();
  const pkg = assessments.find((assessment) => assessment.id === assessmentId);
  if (!pkg) {
    notFound();
  }

  const summary = getAssessmentSummary(db, pkg);
  const lastLevel = summary.session?.lastLevelNumber;
  const initialLevel =
    lastLevel && pkg.levels.some((level) => level.number === lastLevel)
      ? lastLevel
      : (summary.levels.find((level) => !level.passed)?.number ??
        pkg.levels[0].number);

  const levelPkg = pkg.levels.find((level) => level.number === initialLevel);
  if (!levelPkg) {
    notFound();
  }

  const seeded = getOrSeedFiles(db, pkg, initialLevel);
  const detail = await getLevelDetail(db, pkg, levelPkg);

  const initialCode: CodeResponseDto = {
    files: seeded.files,
    seeded: seeded.seeded,
    warning: seeded.warning,
    added: seeded.added,
    codeModifiedSincePass: detail.progress.codeModifiedSincePass,
  };

  return (
    <AssessmentWorkspace
      summary={summary}
      initialLevel={initialLevel}
      initialDetail={detail}
      initialCode={initialCode}
    />
  );
}
