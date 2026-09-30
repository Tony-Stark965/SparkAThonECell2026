import { NextResponse } from "next/server";
import { getAuthenticatedJudge, requestJudgingCorrection } from "@/lib/supabase/judge";

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
    const { reason, explanation } = body || {};

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "A correction reason is required." },
        { status: 400 }
      );
    }

    if (!explanation || typeof explanation !== "string" || explanation.trim().length < 10) {
      return NextResponse.json(
        { error: "A detailed explanation of at least 10 characters is required." },
        { status: 400 }
      );
    }

    const result = await requestJudgingCorrection(authResult.judge.id, registrationId, {
      reason,
      explanation,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      requestId: result.requestId,
      requestedAt: result.requestedAt,
      status: result.status,
    });
  } catch (error) {
    console.error("[Judge Correction Request Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
