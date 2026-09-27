import { NextResponse } from "next/server";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import {
  deleteRegistration,
  getRegistrations,
  adminUpdateTeamDetails,
  adminEditParticipant,
  adminAddParticipant,
  adminRemoveParticipant,
} from "@/lib/supabase/admin";
import { PROTECTED_QA_IDS } from "@/lib/supabase/types";

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

    const registrations = await getRegistrations();
    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error("[Admin Registration GET Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

export async function PATCH(request: Request) {
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
    const { registrationId, action } = body;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing registrationId." },
        { status: 400 }
      );
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing action." },
        { status: 400 }
      );
    }

    // 4. Dispatch action
    switch (action) {
      case "EDIT_TEAM": {
        const teamData = body.data;
        if (!teamData || typeof teamData !== "object") {
          return NextResponse.json(
            { error: "Missing team data payload." },
            { status: 400 }
          );
        }

        const {
          team_name,
          college,
          domain,
          team_leader_name,
          team_leader_roll_no,
          team_leader_mobile,
          team_leader_email,
        } = teamData;

        if (!team_name || team_name.trim().length < 2) {
          return NextResponse.json(
            { error: "Team Name must be at least 2 characters." },
            { status: 400 }
          );
        }
        if (!college || college.trim().length < 2) {
          return NextResponse.json(
            { error: "College name must be at least 2 characters." },
            { status: 400 }
          );
        }
        if (!domain || typeof domain !== "string") {
          return NextResponse.json(
            { error: "Technical domain selection is required." },
            { status: 400 }
          );
        }
        if (!team_leader_name || team_leader_name.trim().length < 2) {
          return NextResponse.json(
            { error: "Team Leader Name must be at least 2 characters." },
            { status: 400 }
          );
        }
        if (!team_leader_roll_no || !team_leader_roll_no.trim()) {
          return NextResponse.json(
            { error: "Team Leader Roll Number is required." },
            { status: 400 }
          );
        }
        const cleanMobile = (team_leader_mobile || "").replace(/\D/g, "");
        if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
          return NextResponse.json(
            { error: "Enter a valid 10-digit Indian mobile number for Team Leader." },
            { status: 400 }
          );
        }
        const cleanEmail = (team_leader_email || "").trim().toLowerCase();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return NextResponse.json(
            { error: "Enter a valid email address for Team Leader." },
            { status: 400 }
          );
        }

        const result = await adminUpdateTeamDetails(registrationId, {
          team_name: team_name.trim(),
          college: college.trim(),
          domain: domain.trim(),
          team_leader_name: team_leader_name.trim(),
          team_leader_roll_no: team_leader_roll_no.trim(),
          team_leader_mobile: cleanMobile,
          team_leader_email: cleanEmail,
        });

        return NextResponse.json({
          success: true,
          message: "Team specifications updated successfully.",
          registration: result.registration,
          attendance: result.attendance,
        });
      }

      case "EDIT_MEMBER": {
        const { memberIndex, data: memberData } = body;
        if (typeof memberIndex !== "number" || memberIndex < 0) {
          return NextResponse.json(
            { error: "Invalid or missing memberIndex." },
            { status: 400 }
          );
        }
        if (!memberData || typeof memberData !== "object") {
          return NextResponse.json(
            { error: "Missing member data payload." },
            { status: 400 }
          );
        }

        const { name, roll_no, mobile } = memberData;
        if (!name || name.trim().length < 2) {
          return NextResponse.json(
            { error: "Participant name must be at least 2 characters." },
            { status: 400 }
          );
        }
        if (!roll_no || !roll_no.trim()) {
          return NextResponse.json(
            { error: "Participant roll number is required." },
            { status: 400 }
          );
        }
        const cleanMobile = (mobile || "").replace(/\D/g, "");
        if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
          return NextResponse.json(
            { error: "Enter a valid 10-digit Indian mobile number." },
            { status: 400 }
          );
        }

        const result = await adminEditParticipant(registrationId, memberIndex, {
          name: name.trim(),
          roll_no: roll_no.trim(),
          mobile: cleanMobile,
        });

        return NextResponse.json({
          success: true,
          message: "Participant information updated successfully.",
          registration: result.registration,
          attendance: result.attendance,
        });
      }

      case "ADD_MEMBER": {
        const memberData = body.data;
        if (!memberData || typeof memberData !== "object") {
          return NextResponse.json(
            { error: "Missing member data payload." },
            { status: 400 }
          );
        }

        const { name, roll_no, mobile } = memberData;
        if (!name || name.trim().length < 2) {
          return NextResponse.json(
            { error: "Participant name must be at least 2 characters." },
            { status: 400 }
          );
        }
        if (!roll_no || !roll_no.trim()) {
          return NextResponse.json(
            { error: "Participant roll number is required." },
            { status: 400 }
          );
        }
        const cleanMobile = (mobile || "").replace(/\D/g, "");
        if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
          return NextResponse.json(
            { error: "Enter a valid 10-digit Indian mobile number." },
            { status: 400 }
          );
        }

        const result = await adminAddParticipant(registrationId, {
          name: name.trim(),
          roll_no: roll_no.trim(),
          mobile: cleanMobile,
        });

        return NextResponse.json({
          success: true,
          message: "Participant added to squad successfully.",
          registration: result.registration,
          attendance: result.attendance,
        });
      }

      case "REMOVE_MEMBER": {
        const { memberIndex } = body;
        if (typeof memberIndex !== "number" || memberIndex <= 0) {
          return NextResponse.json(
            { error: "Invalid memberIndex. Leader cannot be removed." },
            { status: 400 }
          );
        }

        const result = await adminRemoveParticipant(registrationId, memberIndex);

        return NextResponse.json({
          success: true,
          message: "Participant removed from squad successfully.",
          registration: result.registration,
          attendance: result.attendance,
        });
      }

      default:
        return NextResponse.json(
          {
            error:
              "Unsupported action. Allowed actions: EDIT_TEAM, EDIT_MEMBER, ADD_MEMBER, REMOVE_MEMBER.",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Admin Registration PATCH Route Error]:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
