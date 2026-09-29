import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { getJudgingResults } from "@/lib/supabase/admin";

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
    const domain = searchParams.get("domain") || undefined;

    const leaderboards = await getJudgingResults(domain);

    // Extract the leaderboard array for the requested domain (case-insensitive)
    const matchedKey = domain
      ? Object.keys(leaderboards).find(
          (k) => k.toLowerCase() === domain.toLowerCase()
        )
      : undefined;

    const results = matchedKey
      ? (leaderboards[matchedKey] || [])
      : Object.values(leaderboards).flat();

    return NextResponse.json({ success: true, results, leaderboards });
  } catch (error) {
    console.error("[Admin Results GET Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
