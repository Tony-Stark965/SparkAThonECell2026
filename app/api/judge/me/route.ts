import { NextResponse } from "next/server";
import { getAuthenticatedJudge } from "@/lib/supabase/judge";

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

    return NextResponse.json({
      success: true,
      judge: authResult.judge,
    });
  } catch (error) {
    console.error("[Judge Me Route Error]:", error);
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
