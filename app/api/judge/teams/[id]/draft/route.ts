import { NextResponse } from "next/server";
import { getAuthenticatedJudge, saveJudgingDraft } from "@/lib/supabase/judge";

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
    const { scores, feedback } = body || {};

    if (scores !== undefined && (typeof scores !== "object" || scores === null || Array.isArray(scores))) {
      return NextResponse.json(
        { error: "Invalid scores format. Expected an object mapping rubric IDs to numeric scores." },
        { status: 400 }
      );
    }

    const result = await saveJudgingDraft(authResult.judge.id, registrationId, {
      scores: scores || {},
      feedback: typeof feedback === "string" ? feedback : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Evaluation draft persisted successfully.",
      total_score: result.total_score,
      evaluation: result.evaluation,
    });
  } catch (error) {
    console.error("[Judge Draft Save Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
