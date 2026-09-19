export interface Participant {
  name: string;
  roll_no?: string;
  mobile: string;
  email?: string;
  isLeader?: boolean;
}

export interface RegistrationRecord {
  id: string;
  team_name: string;
  college: string;
  participant_count: number;
  team_leader_name: string;
  team_leader_roll_no: string | null;
  team_leader_mobile: string;
  team_leader_email?: string | null;
  participants: Participant[];
  registration_fee: number;
  payment_status: "pending" | "completed" | string;
  payment_reference: string | null;
  domain?: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationStats {
  totalTeams: number;
  totalMembers: number;
  paidCount: number;
  pendingCount: number;
  totalCollected: number;
}

/**
 * Computes dashboard telemetry and metrics from registrations array.
 * - pendingPayments MUST count ONLY payment_status === "pending"
 * - paidCount MUST count ONLY payment_status === "completed" (or legacy "paid")
 * - totalCollected MUST only include registrations where payment_status === "completed" (or legacy "paid")
 * - Pending registrations contribute ₹0.
 */
export function calculateRegistrationStats(
  registrations: RegistrationRecord[]
): RegistrationStats {
  const totalTeams = registrations.length;

  let totalMembers = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let totalCollected = 0;

  for (const reg of registrations) {
    totalMembers += Number(reg.participant_count) || 0;

    const status = (reg.payment_status || "").trim().toLowerCase();
    if (status === "completed" || status === "paid") {
      paidCount++;
      totalCollected += Number(reg.registration_fee) || 0;
    } else if (status === "pending") {
      pendingCount++;
    }
  }

  return {
    totalTeams,
    totalMembers,
    paidCount,
    pendingCount,
    totalCollected,
  };
}

export type AttendanceStatus = "present" | "absent" | "not_marked";

export interface AttendanceRecord {
  id?: string;
  registration_id: string;
  participant_index: number;
  participant_name: string;
  participant_roll_no?: string | null;
  status: AttendanceStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSummary {
  totalParticipants: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  completedTeamsCount: number;
}

export const PROTECTED_QA_IDS = [
  "24e6de4e-04de-4168-98a8-34876b310d00", // QA-SPARK-02
  "044eb1bf-7212-40f2-9fd2-164cbe06fde8", // TEST-SPARK
  "c8bfe256-d359-4d21-b8ea-9a40f3f02a93", // JJ
];

/**
 * Computes attendance summary metrics from registrations and attendance records map.
 * attendanceMap key: `${registration_id}_${participant_index}`
 */
export function calculateAttendanceSummary(
  registrations: RegistrationRecord[],
  attendanceMap: Record<string, AttendanceStatus>
): AttendanceSummary {
  let totalParticipants = 0;
  let presentCount = 0;
  let absentCount = 0;
  let unmarkedCount = 0;
  let completedTeamsCount = 0;

  for (const reg of registrations) {
    const pCount = Number(reg.participant_count) || (reg.participants?.length || 0);
    totalParticipants += pCount;

    let teamAllMarked = pCount > 0;

    for (let i = 0; i < pCount; i++) {
      const key = `${reg.id}_${i}`;
      const status = attendanceMap[key] || "not_marked";

      if (status === "present") {
        presentCount++;
      } else if (status === "absent") {
        absentCount++;
      } else {
        unmarkedCount++;
        teamAllMarked = false;
      }
    }

    if (teamAllMarked && pCount > 0) {
      completedTeamsCount++;
    }
  }

  return {
    totalParticipants,
    presentCount,
    absentCount,
    unmarkedCount,
    completedTeamsCount,
  };
}
