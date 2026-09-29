import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import {
  getRubrics,
  createRubric,
  updateRubric,
  reorderRubrics,
} from "@/lib/supabase/admin";

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

    const rubrics = await getRubrics(true);
    return NextResponse.json({ success: true, rubrics });
  } catch (error) {
    console.error("[Admin Rubrics GET Route Error]:", error);
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
    const { name, description, max_score, sort_order } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Criterion name is required." },
        { status: 400 }
      );
    }

    const rubric = await createRubric({
      name,
      description,
      max_score: Number(max_score) || 10,
      sort_order: Number(sort_order) || 0,
    });

    return NextResponse.json({
      success: true,
      message: `Rubric criterion '${rubric.name}' created successfully.`,
      rubric,
    });
  } catch (error) {
    console.error("[Admin Rubrics POST Route Error]:", error);
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

    // Support batch reordering
    if (Array.isArray(body.orderedIds)) {
      await reorderRubrics(body.orderedIds);
      const rubrics = await getRubrics(true);
      return NextResponse.json({
        success: true,
        message: "Rubrics order updated successfully.",
        rubrics,
      });
    }

    const { id, name, description, max_score, sort_order, is_active } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid criterion id." },
        { status: 400 }
      );
    }

    const rubric = await updateRubric(id, {
      name,
      description,
      max_score,
      sort_order,
      is_active,
    });

    return NextResponse.json({
      success: true,
      message: "Rubric criterion updated successfully.",
      rubric,
    });
  } catch (error) {
    console.error("[Admin Rubrics PATCH Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
