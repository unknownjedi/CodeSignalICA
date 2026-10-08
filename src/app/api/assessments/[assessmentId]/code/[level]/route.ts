import { z } from "zod";
import { ensureReady } from "@/lib/server/bootstrap";
import {
  getOrSeedFiles,
  getLatestPassedSubmit,
  hashFiles,
  normalizeFiles,
  saveFiles,
} from "@/lib/assessments/repository";
import { badRequest, json, notFound, serverError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const putSchema = z.object({
  files: z.record(z.string(), z.string()),
});

async function resolveLevel(assessmentId: string, level: string) {
  const levelNumber = Number(level);
  if (!Number.isInteger(levelNumber) || levelNumber <= 0) {
    return { error: badRequest("Level must be a positive integer.") } as const;
  }
  const { db, assessments } = await ensureReady();
  const pkg = assessments.find((assessment) => assessment.id === assessmentId);
  if (!pkg) {
    return { error: notFound(`Unknown assessment: ${assessmentId}`) } as const;
  }
  const levelPkg = pkg.levels.find((candidate) => candidate.number === levelNumber);
  if (!levelPkg) {
    return { error: notFound(`Unknown level: ${levelNumber}`) } as const;
  }
  return { db, pkg, levelPkg, levelNumber } as const;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/assessments/[assessmentId]/code/[level]">
) {
  try {
    const { assessmentId, level } = await ctx.params;
    const resolved = await resolveLevel(assessmentId, level);
    if ("error" in resolved) {
      return resolved.error;
    }
    const { db, pkg, levelPkg } = resolved;

    const seed = getOrSeedFiles(db, pkg, levelPkg.number);
    const passedSubmit = getLatestPassedSubmit(db, pkg.id, levelPkg.number);
    const codeModifiedSincePass = Boolean(
      passedSubmit && hashFiles(seed.files) !== passedSubmit.codeHash
    );

    return json({
      files: seed.files,
      seeded: seed.seeded,
      warning: seed.warning,
      added: seed.added,
      codeModifiedSincePass,
    });
  } catch (error) {
    console.error("[api/code/:level] Failed to load code:", error);
    return serverError();
  }
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/assessments/[assessmentId]/code/[level]">
) {
  try {
    const { assessmentId, level } = await ctx.params;
    const resolved = await resolveLevel(assessmentId, level);
    if ("error" in resolved) {
      return resolved.error;
    }
    const { db, pkg, levelPkg } = resolved;

    const parsed = putSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Request body must be { files: Record<string, string> }.");
    }

    const files = normalizeFiles(levelPkg, parsed.data.files);
    saveFiles(db, pkg.id, levelPkg.number, files);
    const passedSubmit = getLatestPassedSubmit(db, pkg.id, levelPkg.number);
    return json({
      updatedAt: new Date().toISOString(),
      codeModifiedSincePass: Boolean(
        passedSubmit && hashFiles(files) !== passedSubmit.codeHash
      ),
    });
  } catch (error) {
    console.error("[api/code/:level] Failed to save code:", error);
    return serverError();
  }
}
