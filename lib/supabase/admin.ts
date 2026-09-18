import { createClient } from "@supabase/supabase-js";

// Ensure this module cannot be bundled or executed on the client
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/admin.ts can only be executed on the server.");
}

import type {
  Participant,
  RegistrationRecord,
  RegistrationStats,
} from "./types";

export type {
  Participant,
  RegistrationRecord,
  RegistrationStats,
};
export { calculateRegistrationStats } from "./types";

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
