import { NextResponse } from "next/server";
import { getAuthenticatedJudge, getJudgeTeamDossier } from "@/lib/supabase/judge";

export const dynamic = "force-dynamic";

export async function GET(
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

    // STRICT SECURITY: Verifies assignment server-side
    const dossier = await getJudgeTeamDossier(authResult.judge.id, registrationId);

    if (!dossier) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You are not assigned to evaluate this team or the team does not exist.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error) {
    console.error("[Judge Team Dossier Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
