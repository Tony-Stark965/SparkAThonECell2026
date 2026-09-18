import { NextResponse } from "next/server";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export const runtime = "nodejs";

interface ParticipantInput {
  name: string;
  rollNo?: string;
  roll_no?: string;
  mobile: string;
  isLeader?: boolean;
}

interface StoredParticipant {
  name: string;
  roll_no: string;
  mobile: string;
  email?: string;
  isLeader: boolean;
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
  teamLeaderEmail?: string;
  leaderEmail?: string;
  domain?: string;
  participants: ParticipantInput[];
  registrationFee?: number;
  fee?: number;
}

// In-memory development buffer when Supabase is not configured locally
interface DevRecord {
  id: string;
  teamName: string;
  college: string;
  domain: string;
  participantCount: number;
  teamLeaderName: string;
  teamLeaderRollNo: string;
  teamLeaderMobile: string;
  teamLeaderEmail: string;
  participants: StoredParticipant[];
  registrationFee: number;
  paymentStatus: string;
  createdAt: string;
}

const devRegistrationBuffer: DevRecord[] = [];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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
    const domain = (body.domain || "").trim();
    const participantCount = body.participantCount;
    const teamLeaderName = (body.teamLeaderName || body.leaderName || "").trim();
    const teamLeaderRollNo = (body.teamLeaderRollNo || body.leaderRollNo || "").trim();
    const rawLeaderMobile = (body.teamLeaderMobile || body.leaderMobile || "").trim();
    const rawLeaderEmail = (body.teamLeaderEmail || body.leaderEmail || "").trim();
    const normLeaderEmail = rawLeaderEmail.toLowerCase();
    const participants = body.participants || [];

    // Official Spark-A-Thon Sector Domains Allowlist
    const OFFICIAL_DOMAINS = [
      "AI and Cybersec",
      "Smart Energy Systems",
      "Robotics or Drone and Fixed Wing",
      "IoT or Embedded Systems",
      "Open Innovation",
    ] as const;

    // 1. Validation: Required fields
    if (!teamName || teamName.length < 2) {
      return NextResponse.json(
        { error: "Team Name is required (minimum 2 characters)." },
        { status: 400 }
      );
    }
    if (!college || college.length < 2) {
      return NextResponse.json(
        { error: "College / Institution is required (minimum 2 characters)." },
        { status: 400 }
      );
    }
    if (!domain) {
      return NextResponse.json(
        { error: "Domain / sector selection is required. Please select one official domain." },
        { status: 400 }
      );
    }
    if (!OFFICIAL_DOMAINS.includes(domain as (typeof OFFICIAL_DOMAINS)[number])) {
      return NextResponse.json(
        { error: "Invalid domain selected. Please select an official Spark-A-Thon domain sector." },
        { status: 400 }
      );
    }
    if (!teamLeaderName || teamLeaderName.length < 2) {
      return NextResponse.json(
        { error: "Team Leader Name is required (minimum 2 characters)." },
        { status: 400 }
      );
    }
    if (!teamLeaderRollNo) {
      return NextResponse.json(
        { error: "Team Leader Roll Number is required." },
        { status: 400 }
      );
    }

    // Leader Email validation
    if (!normLeaderEmail) {
      return NextResponse.json(
        { error: "Team Leader Email is required." },
        { status: 400 }
      );
    }
    if (!isValidEmail(normLeaderEmail)) {
      return NextResponse.json(
        { error: "Invalid Team Leader Email. Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Validation: Participant count (strictly 2 to 5)
    const count = Number(participantCount);
    if (!Number.isInteger(count) || ![2, 3, 4, 5].includes(count)) {
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

    const cleanedParticipants: StoredParticipant[] = [];
    const seenMobiles = new Set<string>();

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const pName = (p?.name || "").trim();
      const pRoll = (p?.rollNo || p?.roll_no || "").trim();
      const pMobile = normalizeIndianMobile(p?.mobile || "");

      // For participant 01, resolve to leader if omitted
      const resolvedName = i === 0 ? (pName || teamLeaderName) : pName;
      const resolvedRoll = i === 0 ? (pRoll || teamLeaderRollNo) : pRoll;
      const resolvedMobile = i === 0 ? (pMobile || normLeaderMobile) : pMobile;

      if (!resolvedName || resolvedName.length < 2) {
        return NextResponse.json(
          { error: `Full name is required for Participant 0${i + 1} (minimum 2 characters).` },
          { status: 400 }
        );
      }

      if (!resolvedRoll) {
        return NextResponse.json(
          { error: `Roll number is required for Participant 0${i + 1} (${resolvedName}).` },
          { status: 400 }
        );
      }

      if (!isValidIndianMobile(resolvedMobile)) {
        return NextResponse.json(
          {
            error: `Invalid mobile number for Participant 0${i + 1} (${resolvedName}). Enter a valid 10-digit Indian mobile number.`,
          },
          { status: 400 }
        );
      }

      if (seenMobiles.has(resolvedMobile)) {
        return NextResponse.json(
          {
            error: `Duplicate mobile number detected for Participant 0${i + 1}. Every team member must have a unique mobile number.`,
          },
          { status: 400 }
        );
      }
      seenMobiles.add(resolvedMobile);

      cleanedParticipants.push({
        name: resolvedName,
        roll_no: resolvedRoll,
        mobile: resolvedMobile,
        ...(i === 0 ? { email: normLeaderEmail } : {}),
        isLeader: i === 0,
      });
    }

    // 5. Calculate and validate registration fee (2-4 => ₹400, 5 => ₹450)
    const expectedFee = count === 5 ? 450 : 400;
    const fee = SPARKATHON_CONFIG.pricing.calculateFee(count);
    if (fee !== expectedFee) {
      return NextResponse.json(
        { error: "Pricing calculation mismatch." },
        { status: 500 }
      );
    }

    // Reject arbitrary client-supplied fee if provided and mismatched
    const clientSuppliedFee = body.registrationFee ?? body.fee;
    if (clientSuppliedFee !== undefined && Number(clientSuppliedFee) !== expectedFee) {
      return NextResponse.json(
        { error: `Invalid registration fee for ${count} members. Expected ₹${expectedFee}.` },
        { status: 400 }
      );
    }

    // 6. Persistence Protocol
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    // Prioritize server-side SUPABASE_SERVICE_ROLE_KEY; fallback to ANON key if supplied
    const supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ""
    ).trim();

    const paymentUrl =
      process.env.NEXT_PUBLIC_PAYMENT_URL ||
      SPARKATHON_CONFIG.payment.url ||
      "";

    const isSupabaseConfigured =
      Boolean(supabaseUrl) &&
      Boolean(supabaseKey) &&
      !supabaseUrl.includes("your-project.supabase.co") &&
      !supabaseKey.includes("your-service-role-key-here") &&
      !supabaseKey.includes("your-anon-key-here");

    // Scenario A: Supabase Production Environment Configured
    if (isSupabaseConfigured) {
      try {
        const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
        const response = await fetch(`${cleanBaseUrl}/rest/v1/registrations`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            team_name: teamName,
            college: college,
            domain: domain,
            participant_count: count,
            team_leader_name: teamLeaderName,
            team_leader_roll_no: teamLeaderRollNo,
            team_leader_mobile: normLeaderMobile,
            team_leader_email: normLeaderEmail,
            participants: cleanedParticipants,
            registration_fee: fee,
            payment_status: "pending",
            payment_reference: null,
          }),
        });

        let savedRecord: (Record<string, unknown> & { id?: string; team_name?: string; college?: string; domain?: string; participant_count?: number; team_leader_name?: string; team_leader_roll_no?: string; team_leader_mobile?: string; team_leader_email?: string; participants?: unknown; registration_fee?: number; created_at?: string }) | null = null;

        if (!response.ok) {
          const errorBody = await response.text();
          console.warn(`[Supabase Initial Insert Notice] Status: ${response.status}`, errorBody);

          // If migration has not yet been executed in remote production (e.g. domain or email not in schema cache),
          // fallback to inserting without those columns so registrations continue to succeed.
          if (errorBody.includes("PGRST204") || errorBody.includes("column")) {
            const fallbackResponse = await fetch(`${cleanBaseUrl}/rest/v1/registrations`, {
              method: "POST",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                team_name: teamName,
                college: college,
                participant_count: count,
                team_leader_name: teamLeaderName,
                team_leader_roll_no: teamLeaderRollNo,
                team_leader_mobile: normLeaderMobile,
                participants: cleanedParticipants,
                registration_fee: fee,
                payment_status: "pending",
                payment_reference: null,
              }),
            });

            if (!fallbackResponse.ok) {
              const fallbackError = await fallbackResponse.text();
              console.error(`[Supabase Fallback Error] Status: ${fallbackResponse.status}`, fallbackError);
              return NextResponse.json(
                {
                  error:
                    "Database error while saving registration. Please retry or contact event support.",
                },
                { status: 500 }
              );
            }
            const fallbackData = await fallbackResponse.json();
            savedRecord = Array.isArray(fallbackData) ? fallbackData[0] : fallbackData;
          } else {
            return NextResponse.json(
              {
                error:
                  "Database error while saving registration. Please retry or contact event support.",
              },
              { status: 500 }
            );
          }
        } else {
          const data = await response.json();
          savedRecord = Array.isArray(data) ? data[0] : data;
        }

        if (!savedRecord || !savedRecord.id) {
          console.error("Supabase returned empty representation");
          return NextResponse.json(
            {
              error:
                "Database error while confirming registration. Please retry or contact event support.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          persisted: true,
          registrationId: savedRecord.id,
          teamName: savedRecord.team_name,
          college: savedRecord.college,
          domain: savedRecord.domain || domain,
          participantCount: savedRecord.participant_count,
          teamLeaderName: savedRecord.team_leader_name,
          teamLeaderRollNo: savedRecord.team_leader_roll_no,
          teamLeaderMobile: savedRecord.team_leader_mobile,
          teamLeaderEmail: savedRecord.team_leader_email || normLeaderEmail,
          participants: savedRecord.participants,
          fee: savedRecord.registration_fee,
          paymentUrl: paymentUrl || undefined,
          createdAt: savedRecord.created_at,
          message: "Registration completed successfully.",
        });
      } catch (err) {
        console.error("Supabase network error:", err instanceof Error ? err.message : "Unknown error");
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
      domain: domain,
      participantCount: count,
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderRollNo: teamLeaderRollNo.trim(),
      teamLeaderMobile: normLeaderMobile,
      teamLeaderEmail: normLeaderEmail,
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
      domain: devRecord.domain,
      participantCount: count,
      teamLeaderName: devRecord.teamLeaderName,
      teamLeaderRollNo: devRecord.teamLeaderRollNo,
      teamLeaderMobile: devRecord.teamLeaderMobile,
      teamLeaderEmail: devRecord.teamLeaderEmail,
      participants: devRecord.participants,
      fee,
      paymentUrl,
      createdAt: devRecord.createdAt,
      message:
        "Registration successfully verified in local development mode. Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to enable production persistence.",
    });
  } catch (error) {
    console.error("Registration route error:", error);
    return NextResponse.json(
      { error: "Invalid registration payload. Please check your inputs and retry." },
      { status: 400 }
    );
  }
}
