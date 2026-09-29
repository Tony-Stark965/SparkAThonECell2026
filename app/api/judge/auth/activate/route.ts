import { NextResponse } from "next/server";
import { activateJudgeAccount } from "@/lib/supabase/judge";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Registered judge email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const result = await activateJudgeAccount({ email, password });

    return NextResponse.json({
      success: true,
      message: result.message,
      email: result.judge.email,
    });
  } catch (error) {
    console.error("[Judge Auth Activate Error]:", error);
    const message = error instanceof Error ? error.message : "Account activation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
