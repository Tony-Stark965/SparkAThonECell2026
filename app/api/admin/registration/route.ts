import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { deleteRegistration } from "@/lib/supabase/admin";
import { PROTECTED_QA_IDS } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    // 1. Authenticate user from session cookie
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

    // 2. Authorize admin privileges via ADMIN_EMAIL allowlist
    if (!isAuthorizedAdmin(user.email)) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required." },
        { status: 403 }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing registrationId." },
        { status: 400 }
      );
    }

    // 4. Safety Guard: Prevent deleting protected QA records
    if (PROTECTED_QA_IDS.includes(registrationId)) {
      return NextResponse.json(
        { error: "Operation prohibited: This record is a protected system QA record and cannot be deleted." },
        { status: 403 }
      );
    }

    // 5. Execute deletion with server-side service-role helper
    await deleteRegistration(registrationId);

    return NextResponse.json({
      success: true,
      message: "Registration successfully deleted.",
      deletedId: registrationId,
    });
  } catch (error) {
    console.error("[Admin Registration DELETE Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
