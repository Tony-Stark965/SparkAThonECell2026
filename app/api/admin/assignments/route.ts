import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { getJudgeAssignments, assignTeamsToJudge } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }

    if (!isAuthorizedAdmin(user.email)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const judgeId = searchParams.get("judgeId") || undefined;

    const assignments = await getJudgeAssignments(judgeId);
    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("[Admin Assignments GET Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required." },
        { status: 401 }
      );
    }

    if (!isAuthorizedAdmin(user.email)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { judgeId, registrationIds } = body;

    if (!judgeId || typeof judgeId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid judgeId." },
        { status: 400 }
      );
    }

    if (!Array.isArray(registrationIds)) {
      return NextResponse.json(
        { error: "registrationIds must be an array of strings." },
        { status: 400 }
      );
    }

    const assignments = await assignTeamsToJudge(judgeId, registrationIds);

    return NextResponse.json({
      success: true,
      message: `Successfully updated team assignments (${assignments.length} assigned).`,
      assignments,
    });
  } catch (error) {
    console.error("[Admin Assignments POST Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
