import { NextResponse } from "next/server";
import { getAuthenticatedJudge, getJudgeAssignedTeams } from "@/lib/supabase/judge";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await getAuthenticatedJudge();

    if (!authResult.authorized || !authResult.judge) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized: Valid judge session required." },
        { status: 401 }
      );
    }

    const { teams, stats } = await getJudgeAssignedTeams(authResult.judge.id);

    return NextResponse.json({
      success: true,
      judge: {
        id: authResult.judge.id,
        name: authResult.judge.name,
        email: authResult.judge.email,
        domain: authResult.judge.domain,
      },
      stats,
      teams,
    });
  } catch (error) {
    console.error("[Judge Teams Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
