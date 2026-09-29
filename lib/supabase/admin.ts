import { createClient } from "@supabase/supabase-js";

// Ensure this module cannot be bundled or executed on the client
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin.ts can only be executed on the server.");
}

import type {
  Participant,
  RegistrationRecord,
  RegistrationStats,
  AttendanceRecord,
  AttendanceStatus,
  Judge,
  JudgeTeamAssignment,
  JudgingRubric,
  JudgingEvaluation,
  JudgingScore,
  JudgeWithDetails,
  DomainJudgingProgress,
  JudgeProgressItem,
  JudgingProgressStats,
  TeamEvaluationSummary,
  TeamResultRank,
} from "./types";
import {
  PROTECTED_QA_IDS,
  OFFICIAL_DOMAINS,
  calculateRegistrationFee,
  DEFAULT_RUBRIC_CRITERIA,
} from "./types";

export type {
  Participant,
  RegistrationRecord,
  RegistrationStats,
  AttendanceRecord,
  AttendanceStatus,
  Judge,
  JudgeTeamAssignment,
  JudgingRubric,
  JudgingEvaluation,
  JudgingScore,
  JudgeWithDetails,
  DomainJudgingProgress,
  JudgeProgressItem,
  JudgingProgressStats,
  TeamEvaluationSummary,
  TeamResultRank,
};
export {
  calculateRegistrationStats,
  calculateAttendanceSummary,
  calculateRegistrationFee,
  PROTECTED_QA_IDS,
  OFFICIAL_DOMAINS,
  DEFAULT_RUBRIC_CRITERIA,
} from "./types";

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment credentials.");
  }

  const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  return createClient(cleanUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Server-only registration reader.
 * Fetches all registrations ordered by newest first.
 */
export async function getRegistrations(): Promise<RegistrationRecord[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin API] Failed to fetch registrations:", error.message);
    throw new Error("Database query failed while fetching registrations.");
  }

  return (data || []) as RegistrationRecord[];
}

/**
 * Server-only payment status mutator.
 * Securely updates payment_status for a registration record via service-role client.
 */
export async function updatePaymentStatus(
  id: string,
  newStatus: "pending" | "completed"
): Promise<RegistrationRecord> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("registrations")
    .update({
      payment_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`[Admin API] Failed to update payment status for ${id}:`, error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data) {
    throw new Error("Registration record not found.");
  }

  return data as RegistrationRecord;
}

/**
 * Server-only registration deleter.
 * Deletes a registration record and its associated attendance records.
 * Explicitly guards against deleting protected QA records.
 */
export async function deleteRegistration(id: string): Promise<boolean> {
  if (PROTECTED_QA_IDS.includes(id)) {
    throw new Error("Operation prohibited: This record is a protected system QA record and cannot be deleted.");
  }

  const supabase = getAdminClient();

  // 1. Delete associated attendance rows (in case foreign key cascade is not yet applied)
  try {
    await supabase.from("attendance").delete().eq("registration_id", id);
  } catch (attError) {
    console.warn("[Admin API] Attendance cleanup notice:", attError);
  }

  // 2. Delete registration record
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`[Admin API] Failed to delete registration ${id}:`, error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  return true;
}

/**
 * Server-only attendance reader.
 * Returns all attendance records, or empty array if table not yet migrated.
 */
export async function getAttendance(): Promise<AttendanceRecord[]> {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      // If table doesn't exist yet, gracefully return empty array
      console.warn("[Admin API] Notice while fetching attendance:", error.message);
      return [];
    }

    return (data || []) as AttendanceRecord[];
  } catch (err) {
    console.warn("[Admin API] Unexpected error fetching attendance:", err);
    return [];
  }
}

/**
 * Server-only attendance mutator.
 * Upserts a participant's attendance status.
 */
export async function updateAttendance(record: {
  registration_id: string;
  participant_index: number;
  participant_name: string;
  participant_roll_no?: string | null;
  status: AttendanceStatus;
}): Promise<AttendanceRecord> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        registration_id: record.registration_id,
        participant_index: record.participant_index,
        participant_name: record.participant_name,
        participant_roll_no: record.participant_roll_no || null,
        status: record.status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "registration_id,participant_index",
      }
    )
    .select()
    .single();

  if (error) {
    console.error(`[Admin API] Failed to update attendance for ${record.registration_id}_${record.participant_index}:`, error.message);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data) {
    throw new Error("Attendance record could not be saved.");
  }

  return data as AttendanceRecord;
}

export interface EditTeamPayload {
  team_name: string;
  college: string;
  domain: string;
  team_leader_name: string;
  team_leader_roll_no: string;
  team_leader_mobile: string;
  team_leader_email: string;
}

export interface EditMemberPayload {
  name: string;
  roll_no: string;
  mobile: string;
}

export interface AddMemberPayload {
  name: string;
  roll_no: string;
  mobile: string;
}

export async function getRegistrationById(id: string): Promise<RegistrationRecord | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as RegistrationRecord;
}

export async function getAttendanceForRegistration(registrationId: string): Promise<AttendanceRecord[]> {
  const supabase = getAdminClient();
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("registration_id", registrationId)
      .order("participant_index", { ascending: true });

    if (error || !data) return [];
    return data as AttendanceRecord[];
  } catch {
    return [];
  }
}

/**
 * Server-only team details updater.
 * Updates team name, college, official domain, and team leader information.
 * Synchronizes leader data with participants[0] and attendance record 0.
 * PRESERVES registration_fee and payment_status strictly untouched.
 */
export async function adminUpdateTeamDetails(
  id: string,
  data: EditTeamPayload
): Promise<{ registration: RegistrationRecord; attendance: AttendanceRecord[] }> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration record not found.");

  const domain = data.domain.trim();
  const isOfficial = OFFICIAL_DOMAINS.some(
    (d) => d.toLowerCase() === domain.toLowerCase()
  );
  if (!isOfficial) {
    throw new Error("Invalid technical domain. Please select an official domain.");
  }

  const normEmail = data.team_leader_email.trim().toLowerCase();
  const normMobile = data.team_leader_mobile.replace(/\D/g, "");

  const participants = Array.isArray(current.participants) ? [...current.participants] : [];
  if (participants.length > 0) {
    participants[0] = {
      ...participants[0],
      name: data.team_leader_name.trim(),
      roll_no: data.team_leader_roll_no.trim(),
      mobile: normMobile,
      email: normEmail,
      isLeader: true,
    };
  }

  const supabase = getAdminClient();
  const { data: updated, error } = await supabase
    .from("registrations")
    .update({
      team_name: data.team_name.trim(),
      college: data.college.trim(),
      domain: domain,
      team_leader_name: data.team_leader_name.trim(),
      team_leader_roll_no: data.team_leader_roll_no.trim(),
      team_leader_mobile: normMobile,
      team_leader_email: normEmail,
      participants,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to update team details: ${error?.message || "Unknown error"}`);
  }

  // Synchronize leader attendance record
  try {
    await supabase
      .from("attendance")
      .update({
        participant_name: data.team_leader_name.trim(),
        participant_roll_no: data.team_leader_roll_no.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", id)
      .eq("participant_index", 0);
  } catch (attErr) {
    console.warn("[Admin API] Attendance sync notice:", attErr);
  }

  const attendance = await getAttendanceForRegistration(id);
  return { registration: updated as RegistrationRecord, attendance };
}

/**
 * Server-only participant updater.
 * Updates an individual participant's name, roll number, and mobile number.
 * If updating index 0 (leader), synchronizes top-level team leader columns.
 * Synchronizes attendance record without resetting attendance status.
 */
export async function adminEditParticipant(
  id: string,
  memberIndex: number,
  data: EditMemberPayload
): Promise<{ registration: RegistrationRecord; attendance: AttendanceRecord[] }> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration record not found.");

  const participants = Array.isArray(current.participants) ? [...current.participants] : [];
  if (memberIndex < 0 || memberIndex >= participants.length) {
    throw new Error("Invalid participant index.");
  }

  const name = data.name.trim();
  const roll_no = data.roll_no.trim();
  const mobile = data.mobile.replace(/\D/g, "");

  if (!name || name.length < 2) throw new Error("Participant name must be at least 2 characters.");
  if (!roll_no) throw new Error("Participant roll number is required.");
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    throw new Error("Valid 10-digit Indian mobile number is required.");
  }

  participants[memberIndex] = {
    ...participants[memberIndex],
    name,
    roll_no,
    mobile,
  };

  const updateFields: Record<string, unknown> = {
    participants,
    updated_at: new Date().toISOString(),
  };

  if (memberIndex === 0) {
    updateFields.team_leader_name = name;
    updateFields.team_leader_roll_no = roll_no;
    updateFields.team_leader_mobile = mobile;
  }

  const supabase = getAdminClient();
  const { data: updated, error } = await supabase
    .from("registrations")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to update participant: ${error?.message || "Unknown error"}`);
  }

  // Synchronize attendance record name and roll_no while preserving status
  try {
    await supabase
      .from("attendance")
      .update({
        participant_name: name,
        participant_roll_no: roll_no,
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", id)
      .eq("participant_index", memberIndex);
  } catch (attErr) {
    console.warn("[Admin API] Attendance sync notice:", attErr);
  }

  const attendance = await getAttendanceForRegistration(id);
  return { registration: updated as RegistrationRecord, attendance };
}

/**
 * Server-only participant adder.
 * Adds a new participant to the squad (enforcing 2–5 members limit).
 * Inserts a corresponding attendance record as 'not_marked'.
 * PRESERVES registration_fee strictly untouched.
 */
export async function adminAddParticipant(
  id: string,
  data: AddMemberPayload
): Promise<{ registration: RegistrationRecord; attendance: AttendanceRecord[] }> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration record not found.");

  const participants = Array.isArray(current.participants) ? [...current.participants] : [];
  if (participants.length >= 5) {
    throw new Error("Team already has the maximum limit of 5 members.");
  }

  const name = data.name.trim();
  const roll_no = data.roll_no.trim();
  const mobile = data.mobile.replace(/\D/g, "");

  if (!name || name.length < 2) throw new Error("Participant name must be at least 2 characters.");
  if (!roll_no) throw new Error("Participant roll number is required.");
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    throw new Error("Valid 10-digit Indian mobile number is required.");
  }

  const newIndex = participants.length;
  const newMember: Participant = {
    name,
    roll_no,
    mobile,
    isLeader: false,
  };
  participants.push(newMember);

  const newCount = participants.length;
  const newFee = calculateRegistrationFee(newCount);

  const supabase = getAdminClient();
  const { data: updated, error } = await supabase
    .from("registrations")
    .update({
      participants,
      participant_count: newCount,
      registration_fee: newFee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to add participant: ${error?.message || "Unknown error"}`);
  }

  // Create attendance record for the new member as 'not_marked'
  try {
    await supabase
      .from("attendance")
      .upsert(
        {
          registration_id: id,
          participant_index: newIndex,
          participant_name: name,
          participant_roll_no: roll_no,
          status: "not_marked",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "registration_id,participant_index" }
      );
  } catch (attErr) {
    console.warn("[Admin API] Attendance sync notice:", attErr);
  }

  const attendance = await getAttendanceForRegistration(id);
  return { registration: updated as RegistrationRecord, attendance };
}

/**
 * Server-only participant remover.
 * Removes a member from the squad (enforcing minimum 2 members limit, leader cannot be removed).
 * Re-indexes attendance records for remaining members while preserving existing statuses.
 * PRESERVES registration_fee strictly untouched.
 */
export async function adminRemoveParticipant(
  id: string,
  memberIndex: number
): Promise<{ registration: RegistrationRecord; attendance: AttendanceRecord[] }> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration record not found.");

  const participants = Array.isArray(current.participants) ? [...current.participants] : [];
  if (participants.length <= 2) {
    throw new Error("Teams must have at least 2 members. Removal prohibited.");
  }
  if (memberIndex === 0) {
    throw new Error("The designated team leader cannot be removed.");
  }
  if (memberIndex < 0 || memberIndex >= participants.length) {
    throw new Error("Invalid participant index to remove.");
  }

  // 1. Snapshot current attendance statuses
  const existingAttendance = await getAttendanceForRegistration(id);
  const statusMap: Record<number, AttendanceStatus> = {};
  for (const att of existingAttendance) {
    statusMap[att.participant_index] = att.status;
  }

  // 2. Remove member from roster
  participants.splice(memberIndex, 1);

  const newCount = participants.length;
  const newFee = calculateRegistrationFee(newCount);

  const supabase = getAdminClient();
  const { data: updated, error } = await supabase
    .from("registrations")
    .update({
      participants,
      participant_count: newCount,
      registration_fee: newFee,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(`Failed to remove participant: ${error?.message || "Unknown error"}`);
  }

  // 3. Atomically synchronize attendance: delete existing and re-insert remaining with preserved statuses
  try {
    await supabase.from("attendance").delete().eq("registration_id", id);

    const newAttendanceRows = participants.map((p, newIdx) => {
      const oldIdx = newIdx < memberIndex ? newIdx : newIdx + 1;
      const status = statusMap[oldIdx] || "not_marked";

      return {
        registration_id: id,
        participant_index: newIdx,
        participant_name: p.name,
        participant_roll_no: p.roll_no || null,
        status,
        updated_at: new Date().toISOString(),
      };
    });

    if (newAttendanceRows.length > 0) {
      await supabase.from("attendance").insert(newAttendanceRows);
    }
  } catch (attErr) {
    console.warn("[Admin API] Attendance sync notice on remove:", attErr);
  }

  const attendance = await getAttendanceForRegistration(id);
  return { registration: updated as RegistrationRecord, attendance };
}

// ============================================================
// JUDGES & TEAM ASSIGNMENT DATA OPERATIONS (SERVER-ONLY)
// ============================================================

/**
 * Server-only judges fetcher.
 * Retrieves all judges along with their computed assigned and judged team statistics.
 */
export async function getJudges(): Promise<JudgeWithDetails[]> {
  const supabase = getAdminClient();

  try {
    const [{ data: judgesData, error: jErr }, { data: assignData }, { data: evalData }] =
      await Promise.all([
        supabase.from("judges").select("*").order("name", { ascending: true }),
        supabase.from("judge_team_assignments").select("*"),
        supabase.from("judging_evaluations").select("*"),
      ]);

    if (jErr) {
      console.warn("[Admin API] Judges table query notice:", jErr.message);
      return [];
    }

    const judges = (judgesData || []) as Judge[];
    const assignments = (assignData || []) as JudgeTeamAssignment[];
    const evaluations = (evalData || []) as JudgingEvaluation[];

    const submittedSet = new Set(
      evaluations.filter((e) => e.status === "submitted").map((e) => `${e.judge_id}_${e.registration_id}`)
    );

    return judges.map((judge) => {
      const myAssignments = assignments.filter((a) => a.judge_id === judge.id);
      const assignedIds = myAssignments.map((a) => a.registration_id);
      const judgedCount = assignedIds.filter((regId) => submittedSet.has(`${judge.id}_${regId}`)).length;
      const remainingCount = Math.max(0, assignedIds.length - judgedCount);

      return {
        ...judge,
        assigned_teams_count: assignedIds.length,
        judged_count: judgedCount,
        remaining_count: remainingCount,
        assigned_registration_ids: assignedIds,
      };
    });
  } catch (error) {
    console.warn("[Admin API] Failed to fetch judges:", error);
    return [];
  }
}

/**
 * Server-only judge creator.
 * Validates domain against official allowlist and registers a new judge.
 */
export async function createJudge(payload: {
  name: string;
  email: string;
  domain: string;
  is_active?: boolean;
}): Promise<Judge> {
  const supabase = getAdminClient();

  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  const domain = payload.domain.trim();

  if (!name || name.length < 2) {
    throw new Error("Judge name must be at least 2 characters.");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address for the judge.");
  }

  const matchedDomain = OFFICIAL_DOMAINS.find(
    (d) => d.toLowerCase() === domain.toLowerCase()
  );
  if (!matchedDomain) {
    throw new Error(`Invalid technical domain. Must be one of: ${OFFICIAL_DOMAINS.join(", ")}`);
  }

  const { data, error } = await supabase
    .from("judges")
    .insert({
      name,
      email,
      domain: matchedDomain,
      is_active: payload.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    if (error?.code === "23505" || error?.message?.includes("unique")) {
      throw new Error(`A judge with email '${email}' is already registered.`);
    }
    throw new Error(`Failed to create judge: ${error?.message || "Unknown error"}`);
  }

  return data as Judge;
}

/**
 * Server-only judge updater.
 */
export async function updateJudge(
  id: string,
  payload: Partial<{
    name: string;
    email: string;
    domain: string;
    is_active: boolean;
  }>
): Promise<Judge> {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (name.length < 2) throw new Error("Judge name must be at least 2 characters.");
    updates.name = name;
  }

  if (payload.email !== undefined) {
    const email = payload.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    updates.email = email;
  }

  if (payload.domain !== undefined) {
    const matched = OFFICIAL_DOMAINS.find(
      (d) => d.toLowerCase() === payload.domain!.trim().toLowerCase()
    );
    if (!matched) {
      throw new Error(`Invalid domain. Must be one of: ${OFFICIAL_DOMAINS.join(", ")}`);
    }
    updates.domain = matched;
  }

  if (payload.is_active !== undefined) {
    updates.is_active = Boolean(payload.is_active);
  }

  const { data, error } = await supabase
    .from("judges")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update judge: ${error?.message || "Record not found"}`);
  }

  return data as Judge;
}

/**
 * Server-only judge assignments fetcher.
 */
export async function getJudgeAssignments(judgeId?: string): Promise<JudgeTeamAssignment[]> {
  const supabase = getAdminClient();

  try {
    let query = supabase.from("judge_team_assignments").select("*");
    if (judgeId) {
      query = query.eq("judge_id", judgeId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[Admin API] Assignments query notice:", error.message);
      return [];
    }
    return (data || []) as JudgeTeamAssignment[];
  } catch (err) {
    console.warn("[Admin API] Failed to fetch assignments:", err);
    return [];
  }
}

/**
 * Server-only team assigner.
 * STRICT SECURITY INVARIANT:
 * Validates that every target team belongs to the judge's exact assigned domain.
 * Cross-domain assignment is rejected on the server.
 */
export async function assignTeamsToJudge(
  judgeId: string,
  registrationIds: string[]
): Promise<JudgeTeamAssignment[]> {
  const supabase = getAdminClient();

  // 1. Verify judge existence and retrieve domain
  const { data: judge, error: judgeErr } = await supabase
    .from("judges")
    .select("*")
    .eq("id", judgeId)
    .single();

  if (judgeErr || !judge) {
    throw new Error(`Judge not found: ${judgeErr?.message || "Invalid judge ID"}`);
  }

  // 2. Strict Server-Side Domain Validation
  if (registrationIds.length > 0) {
    const { data: teams, error: teamsErr } = await supabase
      .from("registrations")
      .select("id, team_name, domain")
      .in("id", registrationIds);

    if (teamsErr) {
      throw new Error(`Failed to verify target teams: ${teamsErr.message}`);
    }

    const mismatchedTeams = (teams || []).filter(
      (t) => (t.domain || "").trim().toLowerCase() !== judge.domain.trim().toLowerCase()
    );

    if (mismatchedTeams.length > 0) {
      const names = mismatchedTeams
        .map((t) => `'${t.team_name}' (${t.domain || "No domain"})`)
        .join(", ");
      throw new Error(
        `Security Violation: Cross-domain assignment prohibited. Judge '${judge.name}' is assigned to '${judge.domain}', but attempted to assign teams from other domains: ${names}.`
      );
    }
  }

  // 3. Atomically replace assignments for this judge
  const { error: deleteErr } = await supabase
    .from("judge_team_assignments")
    .delete()
    .eq("judge_id", judgeId);

  if (deleteErr) {
    throw new Error(`Failed to clear previous assignments: ${deleteErr.message}`);
  }

  if (registrationIds.length === 0) {
    return [];
  }

  const rowsToInsert = registrationIds.map((regId) => ({
    judge_id: judgeId,
    registration_id: regId,
  }));

  const { data: inserted, error: insertErr } = await supabase
    .from("judge_team_assignments")
    .insert(rowsToInsert)
    .select();

  if (insertErr || !inserted) {
    throw new Error(`Failed to save team assignments: ${insertErr?.message || "Unknown error"}`);
  }

  return inserted as JudgeTeamAssignment[];
}

// ============================================================
// JUDGING RUBRICS DATA OPERATIONS (SERVER-ONLY)
// ============================================================

/**
 * Server-only rubrics fetcher.
 */
export async function getRubrics(includeInactive = true): Promise<JudgingRubric[]> {
  const supabase = getAdminClient();

  try {
    let query = supabase
      .from("judging_rubrics")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      // Return default rubrics representation if database table is not yet seeded
      return DEFAULT_RUBRIC_CRITERIA.map((crit, idx) => ({
        id: `default_${idx + 1}`,
        name: crit.name,
        description: crit.description,
        max_score: crit.max_score,
        sort_order: crit.sort_order,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }

    return data as JudgingRubric[];
  } catch (err) {
    console.warn("[Admin API] Failed to fetch rubrics; returning defaults:", err);
    return DEFAULT_RUBRIC_CRITERIA.map((crit, idx) => ({
      id: `default_${idx + 1}`,
      name: crit.name,
      description: crit.description,
      max_score: crit.max_score,
      sort_order: crit.sort_order,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
}

/**
 * Server-only rubric creator.
 */
export async function createRubric(payload: {
  name: string;
  description?: string;
  max_score: number;
  sort_order?: number;
}): Promise<JudgingRubric> {
  const supabase = getAdminClient();

  const name = payload.name.trim();
  const max_score = Math.max(1, Math.floor(Number(payload.max_score) || 10));
  const sort_order = Number(payload.sort_order) || 0;

  if (!name || name.length < 2) {
    throw new Error("Rubric criterion name must be at least 2 characters.");
  }

  const { data, error } = await supabase
    .from("judging_rubrics")
    .insert({
      name,
      description: payload.description?.trim() || null,
      max_score,
      sort_order,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create rubric criterion: ${error?.message || "Unknown error"}`);
  }

  return data as JudgingRubric;
}

/**
 * Server-only rubric updater.
 */
export async function updateRubric(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    max_score: number;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<JudgingRubric> {
  const supabase = getAdminClient();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.name !== undefined) {
    const name = payload.name.trim();
    if (name.length < 2) throw new Error("Criterion name must be at least 2 characters.");
    updates.name = name;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description.trim() || null;
  }

  if (payload.max_score !== undefined) {
    updates.max_score = Math.max(1, Math.floor(Number(payload.max_score) || 10));
  }

  if (payload.sort_order !== undefined) {
    updates.sort_order = Number(payload.sort_order) || 0;
  }

  if (payload.is_active !== undefined) {
    updates.is_active = Boolean(payload.is_active);
  }

  const { data, error } = await supabase
    .from("judging_rubrics")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update rubric criterion: ${error?.message || "Record not found"}`);
  }

  return data as JudgingRubric;
}

/**
 * Server-only rubric reorderer.
 */
export async function reorderRubrics(orderedIds: string[]): Promise<void> {
  const supabase = getAdminClient();

  const updates = orderedIds.map((id, index) =>
    supabase
      .from("judging_rubrics")
      .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  await Promise.all(updates);
}

// ============================================================
// JUDGING TELEMETRY & RESULTS LEADERBOARD (SERVER-ONLY)
// ============================================================

/**
 * Server-only judging progress telemetry engine.
 */
export async function getJudgingProgress(): Promise<JudgingProgressStats> {
  const supabase = getAdminClient();

  try {
    const [
      { data: judgesData },
      { data: registrationsData },
      { data: assignmentsData },
      { data: evaluationsData },
    ] = await Promise.all([
      supabase.from("judges").select("*").order("name", { ascending: true }),
      supabase.from("registrations").select("id, team_name, domain"),
      supabase.from("judge_team_assignments").select("*"),
      supabase.from("judging_evaluations").select("*"),
    ]);

    const judges = (judgesData || []) as Judge[];
    const registrations = (registrationsData || []) as RegistrationRecord[];
    const assignments = (assignmentsData || []) as JudgeTeamAssignment[];
    const evaluations = (evaluationsData || []) as JudgingEvaluation[];

    const submittedEvaluations = evaluations.filter((e) => e.status === "submitted");

    // Unique assigned and judged registration IDs
    const assignedTeamIds = new Set(assignments.map((a) => a.registration_id));
    const judgedTeamIds = new Set(submittedEvaluations.map((e) => e.registration_id));

    const totalJudges = judges.filter((j) => j.is_active).length;
    const totalAssignedTeams = assignedTeamIds.size;
    const totalJudged = judgedTeamIds.size;
    const totalRemaining = Math.max(0, totalAssignedTeams - totalJudged);

    // Domain progress computation
    const domainProgress = OFFICIAL_DOMAINS.map((domainName) => {
      const domainTeams = registrations.filter(
        (r) => (r.domain || "").trim().toLowerCase() === domainName.toLowerCase()
      );
      const totalTeams = domainTeams.length;
      const domainJudged = domainTeams.filter((t) => judgedTeamIds.has(t.id)).length;
      const remaining = Math.max(0, totalTeams - domainJudged);
      const progressPercent = totalTeams > 0 ? Math.round((domainJudged / totalTeams) * 100) : 0;

      return {
        domain: domainName,
        totalTeams,
        judged: domainJudged,
        remaining,
        progressPercent,
      };
    });

    // Judge progress computation
    const judgeProgress = judges.map((judge) => {
      const myAssignments = assignments.filter((a) => a.judge_id === judge.id);
      const mySubmitted = submittedEvaluations.filter((e) => e.judge_id === judge.id);
      const assignedCount = myAssignments.length;
      const judgedCount = mySubmitted.length;
      const remainingCount = Math.max(0, assignedCount - judgedCount);
      const progressPercent = assignedCount > 0 ? Math.round((judgedCount / assignedCount) * 100) : 0;

      return {
        judge,
        assignedCount,
        judgedCount,
        remainingCount,
        progressPercent,
      };
    });

    return {
      totalJudges,
      totalAssignedTeams,
      totalJudged,
      totalRemaining,
      domainProgress,
      judgeProgress,
    };
  } catch (err) {
    console.warn("[Admin API] Failed to compute judging progress:", err);
    return {
      totalJudges: 0,
      totalAssignedTeams: 0,
      totalJudged: 0,
      totalRemaining: 0,
      domainProgress: OFFICIAL_DOMAINS.map((d) => ({
        domain: d,
        totalTeams: 0,
        judged: 0,
        remaining: 0,
        progressPercent: 0,
      })),
      judgeProgress: [],
    };
  }
}

/**
 * Server-only judging results & domain leaderboard rankings.
 * Computes average score across judge evaluations (compatible with single and multi-judge models).
 * Ranks strictly based on submitted evaluations.
 */
export async function getJudgingResults(
  domainFilter?: string
): Promise<Record<string, TeamResultRank[]>> {
  const supabase = getAdminClient();

  try {
    const [
      { data: registrationsData },
      { data: evaluationsData },
      { data: judgesData },
      { data: rubricsData },
    ] = await Promise.all([
      supabase.from("registrations").select("id, team_name, college, domain"),
      supabase.from("judging_evaluations").select("*"),
      supabase.from("judges").select("id, name"),
      supabase.from("judging_rubrics").select("*").eq("is_active", true),
    ]);

    const registrations = (registrationsData || []) as RegistrationRecord[];
    const evaluations = (evaluationsData || []) as JudgingEvaluation[];
    const judges = (judgesData || []) as Judge[];
    const rubrics = (rubricsData || []) as JudgingRubric[];

    const judgeMap = new Map(judges.map((j) => [j.id, j.name]));
    const maxPossibleScore =
      rubrics.reduce((sum, r) => sum + (Number(r.max_score) || 0), 0) || 50;

    const resultsByDomain: Record<string, TeamResultRank[]> = {};

    for (const domain of OFFICIAL_DOMAINS) {
      if (domainFilter && domainFilter.toLowerCase() !== domain.toLowerCase()) {
        continue;
      }

      const domainTeams = registrations.filter(
        (t) => (t.domain || "").trim().toLowerCase() === domain.toLowerCase()
      );

      const evaluatedTeams: TeamResultRank[] = [];
      const inProgressTeams: TeamResultRank[] = [];
      const standbyTeams: TeamResultRank[] = [];

      for (const team of domainTeams) {
        const teamEvals = evaluations.filter((e) => e.registration_id === team.id);
        const submittedEvals = teamEvals.filter((e) => e.status === "submitted");

        if (submittedEvals.length > 0) {
          const totalScoresSum = submittedEvals.reduce(
            (acc, curr) => acc + (Number(curr.total_score) || 0),
            0
          );
          const averageScore = Math.round((totalScoresSum / submittedEvals.length) * 100) / 100;

          evaluatedTeams.push({
            team_id: team.id,
            team_name: team.team_name,
            college: team.college,
            domain: team.domain || domain,
            evaluation_count: submittedEvals.length,
            average_score: averageScore,
            max_possible_score: maxPossibleScore,
            status: "Completed",
            evaluations: submittedEvals.map((e) => ({
              judge_id: e.judge_id,
              judge_name: judgeMap.get(e.judge_id) || "Judge",
              total_score: Number(e.total_score) || 0,
              submitted_at: e.submitted_at || null,
              status: e.status,
            })),
            rank: 0,
          });
        } else if (teamEvals.length > 0) {
          inProgressTeams.push({
            team_id: team.id,
            team_name: team.team_name,
            college: team.college,
            domain: team.domain || domain,
            evaluation_count: 0,
            average_score: 0,
            max_possible_score: maxPossibleScore,
            status: "In Progress",
            evaluations: teamEvals.map((e) => ({
              judge_id: e.judge_id,
              judge_name: judgeMap.get(e.judge_id) || "Judge",
              total_score: Number(e.total_score) || 0,
              submitted_at: e.submitted_at || null,
              status: e.status,
            })),
            rank: 0,
          });
        } else {
          standbyTeams.push({
            team_id: team.id,
            team_name: team.team_name,
            college: team.college,
            domain: team.domain || domain,
            evaluation_count: 0,
            average_score: 0,
            max_possible_score: maxPossibleScore,
            status: "Unassigned",
            evaluations: [],
            rank: 0,
          });
        }
      }

      // Sort descending by average score
      evaluatedTeams.sort((a, b) => b.average_score - a.average_score);

      // Assign ranks (1-indexed)
      evaluatedTeams.forEach((team, idx) => {
        team.rank = idx + 1;
      });

      resultsByDomain[domain] = [...evaluatedTeams, ...inProgressTeams, ...standbyTeams];
    }

    return resultsByDomain;
  } catch (err) {
    console.warn("[Admin API] Failed to fetch judging results:", err);
    return {};
  }
}
