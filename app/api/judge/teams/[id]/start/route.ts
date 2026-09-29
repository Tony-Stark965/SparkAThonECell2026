import { NextResponse } from "next/server";
import { getAuthenticatedJudge, startJudgingSession } from "@/lib/supabase/judge";

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

    // STRICT SECURITY: Verifies assignment & initializes evaluation with started_at
    const evaluation = await startJudgingSession(authResult.judge.id, registrationId);

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error("[Judge Start Session Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
