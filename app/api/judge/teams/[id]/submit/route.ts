import { NextResponse } from "next/server";
import { getAuthenticatedJudge, submitJudgingEvaluation } from "@/lib/supabase/judge";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await props.params;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json(
        { error: "Invalid registration ID." },
        { status: 400 }
      );
    }

    const authResult = await getAuthenticatedJudge();

    if (!authResult.authorized || !authResult.judge) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized: Valid judge session required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scores, feedback, total_score } = body || {};

    if (!scores || typeof scores !== "object" || Array.isArray(scores)) {
      return NextResponse.json(
        { error: "Scores object is required for submission." },
        { status: 400 }
      );
    }

    // Authoritative Server Validation & Final Submission
    const result = await submitJudgingEvaluation(authResult.judge.id, registrationId, {
      scores,
      feedback: typeof feedback === "string" ? feedback : undefined,
      total_score: typeof total_score === "number" ? total_score : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Evaluation submitted and permanently locked.",
      total_score: result.total_score,
      submitted_at: result.submitted_at,
      evaluation: result.evaluation,
    });
  } catch (error) {
    console.error("[Judge Submit Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
