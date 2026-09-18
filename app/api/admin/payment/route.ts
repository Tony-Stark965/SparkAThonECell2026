import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { updatePaymentStatus } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    const { registrationId, paymentStatus } = body;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing registrationId." },
        { status: 400 }
      );
    }

    const normalizedStatus = (paymentStatus || "").trim().toLowerCase();
    if (normalizedStatus !== "pending" && normalizedStatus !== "completed") {
      return NextResponse.json(
        {
          error:
            "Invalid payment status. Only 'pending' and 'completed' are permitted.",
        },
        { status: 400 }
      );
    }

    // 4. Execute mutation with server-side service-role client
    const updatedRecord = await updatePaymentStatus(
      registrationId,
      normalizedStatus as "pending" | "completed"
    );

    return NextResponse.json({
      success: true,
      message: `Payment status successfully updated to '${normalizedStatus}'.`,
      registration: updatedRecord,
    });
  } catch (error) {
    console.error("[Admin Payment Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
