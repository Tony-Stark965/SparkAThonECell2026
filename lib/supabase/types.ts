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
