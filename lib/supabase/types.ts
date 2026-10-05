export interface Participant {
  name: string;
  roll_no?: string;
  mobile?: string;
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
 * Canonical authoritative pricing calculation for Spark-A-Thon 2026:
 * - 2 to 4 members = ₹350
 * - 5 members = ₹400
 */
export function calculateRegistrationFee(participantCount: number): number {
  return participantCount === 5 ? 400 : 350;
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

export const OFFICIAL_DOMAINS = [
  "AI and Cybersec",
  "Smart Energy Systems",
  "Robotics or Drone and Fixed Wing",
  "IoT or Embedded Systems",
  "Open Innovation",
] as const;

export type OfficialDomain = (typeof OFFICIAL_DOMAINS)[number];

export const OFFICIAL_DOMAIN_CAPACITIES: Record<OfficialDomain, number> = {
  "AI and Cybersec": 12,
  "Smart Energy Systems": 10,
  "Robotics or Drone and Fixed Wing": 8,
  "IoT or Embedded Systems": 8,
  "Open Innovation": 16,
};

export const TOTAL_OFFICIAL_CAPACITY = 54;

export interface DomainCapacityStats {
  domain: OfficialDomain;
  registered: number;
  capacity: number;
  percentage: number;
  slotsRemaining: number;
  isFull: boolean;
  isOverCapacity: boolean;
  paidCount: number;
  pendingCount: number;
  revenue: number;
}

// ============================================================
// JUDGING SYSTEM TYPES & INTERFACES
// ============================================================

export interface Judge {
  id: string;
  name: string;
  email: string;
  auth_user_id?: string | null;
  domain: OfficialDomain;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JudgeTeamAssignment {
  id: string;
  judge_id: string;
  registration_id: string;
  created_at: string;
}

export interface JudgingRubric {
  id: string;
  name: string;
  description?: string | null;
  max_score: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EvaluationStatus = "draft" | "in_progress" | "submitted";

export interface JudgingEvaluation {
  id: string;
  judge_id: string;
  registration_id: string;
  status: EvaluationStatus;
  started_at?: string | null;
  submitted_at?: string | null;
  total_score?: number | null;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JudgingScore {
  id: string;
  evaluation_id: string;
  rubric_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface JudgeWithDetails extends Judge {
  assigned_teams_count: number;
  judged_count: number;
  remaining_count: number;
  assigned_registration_ids: string[];
}

export interface DomainTeamTelemetry {
  team_id: string;
  team_name: string;
  college: string;
  domain: string;
  judge_id: string | null;
  judge_name: string;
  status: "SUBMITTED" | "IN PROGRESS" | "DRAFT" | "NOT STARTED";
  total_score: number | null;
  started_at: string | null;
  submitted_at: string | null;
}

export interface DomainJudgingProgress {
  domain: OfficialDomain;
  totalTeams: number;
  judged: number;
  remaining: number;
  progressPercent: number;
  submittedCount?: number;
  inProgressCount?: number;
  draftCount?: number;
  notStartedCount?: number;
  teams?: DomainTeamTelemetry[];
}

export interface JudgeProgressItem {
  judge: Judge;
  assignedCount: number;
  judgedCount: number;
  remainingCount: number;
  progressPercent: number;
}

export interface JudgingProgressStats {
  totalJudges: number;
  totalAssignedTeams: number;
  totalJudged: number;
  totalRemaining: number;
  domainProgress: DomainJudgingProgress[];
  judgeProgress: JudgeProgressItem[];
}

export interface TeamEvaluationSummary {
  judge_id: string;
  judge_name: string;
  total_score: number;
  submitted_at: string | null;
  status: EvaluationStatus;
}

export interface TeamResultRank {
  team_id: string;
  team_name: string;
  college: string;
  domain: string;
  evaluation_count: number;
  average_score: number;
  max_possible_score: number;
  status: "Completed" | "In Progress" | "Unassigned";
  evaluations: TeamEvaluationSummary[];
  rank: number;
}

export const DEFAULT_RUBRIC_CRITERIA = [
  {
    name: "Creativity & Innovation",
    description: "Originality of the idea, novel approach to the problem, and unique value proposition.",
    max_score: 10,
    sort_order: 1,
  },
  {
    name: "Technical Feasibility",
    description: "Soundness of technical architecture, implementation capability, and appropriate use of modern tools.",
    max_score: 10,
    sort_order: 2,
  },
  {
    name: "Scalability & Market Potential",
    description: "Viability of real-world deployment, growth potential, target market sizing, and sustainability.",
    max_score: 10,
    sort_order: 3,
  },
  {
    name: "Prototype & Demonstration Quality",
    description: "Quality, completeness, functionality, and effectiveness of the working prototype demonstrated by the team.",
    max_score: 10,
    sort_order: 4,
  },
  {
    name: "Problem-Solving Impact",
    description: "Significance of the problem addressed, user benefit, and measurable social or industry impact.",
    max_score: 10,
    sort_order: 5,
  },
] as const;

/**
 * Computes live domain capacity statistics across all official domains
 */
export function calculateDomainCapacityStats(
  registrations: RegistrationRecord[]
): Record<OfficialDomain, DomainCapacityStats> {
  const result = {} as Record<OfficialDomain, DomainCapacityStats>;

  for (const domain of OFFICIAL_DOMAINS) {
    const capacity = OFFICIAL_DOMAIN_CAPACITIES[domain];
    const squads = registrations.filter(
      (r) => (r.domain || "").trim().toLowerCase() === domain.toLowerCase()
    );
    const registered = squads.length;
    const percentage = capacity > 0 ? Math.round((registered / capacity) * 100) : 0;
    const slotsRemaining = Math.max(0, capacity - registered);
    const isFull = registered >= capacity;
    const isOverCapacity = registered > capacity;

    let paidCount = 0;
    let pendingCount = 0;
    let revenue = 0;

    for (const sq of squads) {
      const pStatus = (sq.payment_status || "").trim().toLowerCase();
      if (pStatus === "completed" || pStatus === "paid") {
        paidCount++;
        revenue += Number(sq.registration_fee) || 0;
      } else {
        pendingCount++;
      }
    }

    result[domain] = {
      domain,
      registered,
      capacity,
      percentage,
      slotsRemaining,
      isFull,
      isOverCapacity,
      paidCount,
      pendingCount,
      revenue,
    };
  }

  return result;
}
