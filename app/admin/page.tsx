import { redirect } from "next/navigation";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { getRegistrations, getAttendance } from "@/lib/supabase/admin";
import type { AttendanceRecord } from "@/lib/supabase/types";
import { AdminDashboardClient } from "./components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Authorize admin
  if (!user || !isAuthorizedAdmin(user.email)) {
    redirect("/admin/login");
  }

  // 3. Server Action for logout
  async function handleLogout() {
    "use server";
    const serverSupabase = await createClient();
    await serverSupabase.auth.signOut();
    redirect("/admin/login");
  }

  // 4. Fetch registrations and attendance server-side with service-role helper
  let registrations: Awaited<ReturnType<typeof getRegistrations>> = [];
  let attendance: AttendanceRecord[] = [];
  let fetchError: string | null = null;

  try {
    const [regs, atts] = await Promise.all([
      getRegistrations(),
      getAttendance(),
    ]);
    registrations = regs;
    attendance = atts;
  } catch {
    fetchError = "Unable to load data from the database. Please try refreshing the page.";
  }

  return (
    <AdminDashboardClient
      initialRegistrations={registrations}
      initialAttendance={attendance}
      userEmail={user.email || "Unknown Operator"}
      fetchError={fetchError}
      onLogout={handleLogout}
    />
  );
}

