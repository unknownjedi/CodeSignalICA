import { z } from "zod";
import {
  executeLevel,
  AssessmentNotFoundError,
  LevelNotFoundError,
} from "@/lib/server/execution-service";
import { badRequest, errorJson, json, notFound } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  level: z.number().int().positive(),
  files: z.record(z.string(), z.string()),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/assessments/[assessmentId]/run">
) {
  try {
    const { assessmentId } = await ctx.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return badRequest("Request body must be { level: number, files: Record<string, string> }.");
    }

    const result = await executeLevel({
      assessmentId,
      levelNumber: parsed.data.level,
      files: parsed.data.files,
      type: "run",
    });
    return json(result);
  } catch (error) {
    if (error instanceof AssessmentNotFoundError || error instanceof LevelNotFoundError) {
      return notFound(error.message);
    }
    console.error("[api/run] Execution failed:", error);
    return errorJson(
      "Unable to execute tests. Please check the local application logs.",
      500
    );
  }
}
