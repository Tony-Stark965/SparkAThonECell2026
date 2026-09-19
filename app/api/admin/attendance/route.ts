import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { getAttendance, updateAttendance } from "@/lib/supabase/admin";
import type { AttendanceStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // 3. Fetch attendance records
    const records = await getAttendance();

    return NextResponse.json({
      success: true,
      attendance: records,
    });
  } catch (error) {
    console.error("[Admin Attendance GET Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const {
      registrationId,
      participantIndex,
      participantName,
      participantRollNo,
      status,
    } = body;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing registrationId." },
        { status: 400 }
      );
    }

    if (typeof participantIndex !== "number" || participantIndex < 0) {
      return NextResponse.json(
        { error: "Invalid or missing participantIndex." },
        { status: 400 }
      );
    }

    if (!participantName || typeof participantName !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing participantName." },
        { status: 400 }
      );
    }

    const normalizedStatus = (status || "").trim().toLowerCase();
    if (!["present", "absent", "not_marked"].includes(normalizedStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'present', 'absent', or 'not_marked'." },
        { status: 400 }
      );
    }

    // 4. Update attendance record
    const updated = await updateAttendance({
      registration_id: registrationId,
      participant_index: participantIndex,
      participant_name: participantName.trim(),
      participant_roll_no: participantRollNo ? String(participantRollNo).trim() : null,
      status: normalizedStatus as AttendanceStatus,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance updated to '${normalizedStatus}'.`,
      record: updated,
    });
  } catch (error) {
    console.error("[Admin Attendance POST Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
