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
} from "./types";
import {
  PROTECTED_QA_IDS,
  OFFICIAL_DOMAINS,
  calculateRegistrationFee,
} from "./types";

export type {
  Participant,
  RegistrationRecord,
  RegistrationStats,
  AttendanceRecord,
  AttendanceStatus,
};
export {
  calculateRegistrationStats,
  calculateAttendanceSummary,
  calculateRegistrationFee,
  PROTECTED_QA_IDS,
  OFFICIAL_DOMAINS,
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
