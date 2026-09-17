import { NextResponse } from "next/server";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export const runtime = "nodejs";

interface ParticipantInput {
  name: string;
  mobile: string;
  isLeader?: boolean;
}

interface RegistrationRequestBody {
  teamName: string;
  college: string;
  participantCount: number;
  teamLeaderName?: string;
  leaderName?: string;
  teamLeaderRollNo?: string;
  leaderRollNo?: string;
  teamLeaderMobile?: string;
  leaderMobile?: string;
  participants: ParticipantInput[];
}

// In-memory development buffer when Supabase is not configured locally
interface DevRecord {
  id: string;
  teamName: string;
  college: string;
  participantCount: number;
  teamLeaderName: string;
  teamLeaderRollNo: string;
  teamLeaderMobile: string;
  participants: ParticipantInput[];
  registrationFee: number;
  paymentStatus: string;
  createdAt: string;
}

const devRegistrationBuffer: DevRecord[] = [];

// Clean phone number (strip whitespace, hyphens, leading +91)
function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

function isValidIndianMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

export async function POST(request: Request) {
  try {
    const body: RegistrationRequestBody = await request.json();
    const teamName = (body.teamName || "").trim();
    const college = (body.college || "").trim();
    const participantCount = body.participantCount;
    const teamLeaderName = (body.teamLeaderName || body.leaderName || "").trim();
    const teamLeaderRollNo = (body.teamLeaderRollNo || body.leaderRollNo || "").trim();
    const rawLeaderMobile = (body.teamLeaderMobile || body.leaderMobile || "").trim();
    const participants = body.participants || [];

    // 1. Validation: Required fields
    if (!teamName) {
      return NextResponse.json(
        { error: "Team Name is required." },
        { status: 400 }
      );
    }
    if (!college) {
      return NextResponse.json(
        { error: "College / Institution is required." },
        { status: 400 }
      );
    }
    if (!teamLeaderName) {
      return NextResponse.json(
        { error: "Team Leader Name is required." },
        { status: 400 }
      );
    }
    if (!teamLeaderRollNo) {
      return NextResponse.json(
        { error: "Team Leader Roll Number is required." },
        { status: 400 }
      );
    }

    // 2. Validation: Participant count (strictly 2 to 5)
    const count = Number(participantCount);
    if (![2, 3, 4, 5].includes(count)) {
      return NextResponse.json(
        { error: "Participant count must be strictly 2, 3, 4, or 5 members." },
        { status: 400 }
      );
    }

    // 3. Validation: Team Leader Mobile
    const normLeaderMobile = normalizeIndianMobile(rawLeaderMobile);
    if (!isValidIndianMobile(normLeaderMobile)) {
      return NextResponse.json(
        {
          error:
            "Invalid Team Leader mobile number. Enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 }
      );
    }

    // 4. Validation: Dynamic participants list
    if (!Array.isArray(participants) || participants.length !== count) {
      return NextResponse.json(
        {
          error: `Exactly ${count} participants must be provided.`,
        },
        { status: 400 }
      );
    }

    const cleanedParticipants: ParticipantInput[] = [];
    const seenMobiles = new Set<string>();

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const pName = p?.name?.trim() || "";
      const pMobile = normalizeIndianMobile(p?.mobile || "");

      if (!pName) {
        return NextResponse.json(
          { error: `Full name is required for Participant 0${i + 1}.` },
          { status: 400 }
        );
      }

      if (!isValidIndianMobile(pMobile)) {
        return NextResponse.json(
          {
            error: `Invalid mobile number for Participant 0${i + 1} (${pName}). Enter a valid 10-digit Indian mobile number.`,
          },
          { status: 400 }
        );
      }

      if (seenMobiles.has(pMobile)) {
        return NextResponse.json(
          {
            error: `Duplicate mobile number detected for Participant 0${i + 1}. Every team member must have a unique mobile number.`,
          },
          { status: 400 }
        );
      }
      seenMobiles.add(pMobile);

      cleanedParticipants.push({
        name: pName,
        mobile: pMobile,
        isLeader: i === 0,
      });
    }

    // 5. Calculate official registration fee
    const fee = SPARKATHON_CONFIG.pricing.calculateFee(count);

    // 6. Persistence Protocol
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const paymentUrl =
      process.env.NEXT_PUBLIC_PAYMENT_URL ||
      SPARKATHON_CONFIG.payment.url ||
      "";

    // Scenario A: Supabase Environment Configured
    if (
      supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes("your-project.supabase.co")
    ) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            team_name: teamName.trim(),
            college: college.trim(),
            participant_count: count,
            team_leader_name: teamLeaderName.trim(),
            team_leader_roll_no: teamLeaderRollNo.trim(),
            team_leader_mobile: normLeaderMobile,
            participants: cleanedParticipants,
            registration_fee: fee,
            payment_status: "pending",
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Supabase insert error:", errorText);
          return NextResponse.json(
            {
              error:
                "Database error while saving registration. Please retry or contact event support.",
            },
            { status: 500 }
          );
        }

        const data = await response.json();
        const savedRecord = Array.isArray(data) ? data[0] : data;

        return NextResponse.json({
          success: true,
          persisted: true,
          id: savedRecord.id,
          teamName: savedRecord.team_name,
          college: savedRecord.college,
          participantCount: savedRecord.participant_count,
          teamLeaderName: savedRecord.team_leader_name,
          teamLeaderRollNo: savedRecord.team_leader_roll_no,
          teamLeaderMobile: savedRecord.team_leader_mobile,
          participants: savedRecord.participants,
          fee: savedRecord.registration_fee,
          paymentStatus: savedRecord.payment_status,
          paymentUrl,
          createdAt: savedRecord.created_at,
          message: "Team registration persisted successfully to production database.",
        });
      } catch (err) {
        console.error("Supabase network error:", err);
        return NextResponse.json(
          {
            error:
              "Unable to reach production database. Please check connectivity or try again shortly.",
          },
          { status: 500 }
        );
      }
    }

    // Scenario B: Safe Development Fallback (Supabase credentials not yet supplied)
    const devId = `REG-DEV-${Date.now().toString(36).toUpperCase()}`;
    const devRecord: DevRecord = {
      id: devId,
      teamName: teamName.trim(),
      college: college.trim(),
      participantCount: count,
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderRollNo: teamLeaderRollNo.trim(),
      teamLeaderMobile: normLeaderMobile,
      participants: cleanedParticipants,
      registrationFee: fee,
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    };
    devRegistrationBuffer.push(devRecord);

    console.info(
      `[Spark-A-Thon Dev Registration] Received valid registration for "${devRecord.teamName}" (${count} members, ₹${fee}). Supabase env not provided; saved in dev buffer.`
    );

    return NextResponse.json({
      success: true,
      persisted: false,
      mode: "dev_fallback",
      id: devId,
      teamName: devRecord.teamName,
      college: devRecord.college,
      participantCount: count,
      teamLeaderName: devRecord.teamLeaderName,
      teamLeaderRollNo: devRecord.teamLeaderRollNo,
      teamLeaderMobile: devRecord.teamLeaderMobile,
      participants: devRecord.participants,
      fee,
      paymentStatus: "pending",
      paymentUrl,
      createdAt: devRecord.createdAt,
      message:
        "Registration successfully verified in local development mode. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable production persistence.",
    });
  } catch (error) {
    console.error("Registration route error:", error);
    return NextResponse.json(
      { error: "Invalid registration payload. Please check your inputs and retry." },
      { status: 400 }
    );
  }
}
