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
import { PROTECTED_QA_IDS } from "./types";

export type {
  Participant,
  RegistrationRecord,
  RegistrationStats,
  AttendanceRecord,
  AttendanceStatus,
};
export { calculateRegistrationStats, calculateAttendanceSummary, PROTECTED_QA_IDS } from "./types";

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
