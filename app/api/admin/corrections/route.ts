import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import {
  getCorrectionRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest,
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

    const requests = await getCorrectionRequests();

    const stats = {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      completed: requests.filter((r) => r.status === "completed").length,
      total: requests.length,
    };

    return NextResponse.json({ success: true, requests, stats });
  } catch (error) {
    console.error("[Admin Corrections GET Error]:", error);
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
    const { action, requestId, adminNotes } = body || {};

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { error: "Valid requestId is required." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const result = await approveCorrectionRequest(
        requestId,
        adminNotes,
        user.email
      );
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      const result = await rejectCorrectionRequest(
        requestId,
        adminNotes,
        user.email
      );
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("[Admin Corrections POST Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
