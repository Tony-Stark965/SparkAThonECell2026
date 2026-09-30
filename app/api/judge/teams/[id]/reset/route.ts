import { NextResponse } from "next/server";
import { getAuthenticatedJudge, resetJudgingSession } from "@/lib/supabase/judge";

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

    const result = await resetJudgingSession(authResult.judge.id, registrationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Judge Reset Session Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
