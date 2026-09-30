import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { getJudges, createJudge, updateJudge } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const judges = await getJudges();
    return NextResponse.json({ success: true, judges });
  } catch (error) {
    console.error("[Admin Judges GET Route Error]:", error);
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
    const { name, email, domain, is_active, password } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Judge name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Judge email is required." },
        { status: 400 }
      );
    }

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Assigned domain is required." },
        { status: 400 }
      );
    }

    const judgeResult = await createJudge({
      name,
      email,
      domain,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      password: typeof password === "string" ? password : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Judge '${judgeResult.name}' successfully registered for domain '${judgeResult.domain}'.`,
      judge: judgeResult,
      credentials: {
        email: judgeResult.email,
        password: judgeResult.initialPassword,
      },
    });
  } catch (error) {
    console.error("[Admin Judges POST Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
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
    const { id, name, email, domain, is_active } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Judge ID is required." },
        { status: 400 }
      );
    }

    const judge = await updateJudge(id, {
      name,
      email,
      domain,
      is_active,
    });

    return NextResponse.json({
      success: true,
      message: "Judge record updated successfully.",
      judge,
    });
  } catch (error) {
    console.error("[Admin Judges PATCH Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
