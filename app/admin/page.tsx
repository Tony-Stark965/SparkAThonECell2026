import { redirect } from "next/navigation";
import { createClient, isAuthorizedAdmin } from "@/lib/supabase/server";
import { getRegistrations } from "@/lib/supabase/admin";
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

  // 4. Fetch registrations server-side with service-role helper
  let registrations: Awaited<ReturnType<typeof getRegistrations>> = [];
  let fetchError: string | null = null;

  try {
    registrations = await getRegistrations();
  } catch {
    fetchError = "Unable to load registrations from the database. Please try refreshing the page.";
  }

  return (
    <AdminDashboardClient
      initialRegistrations={registrations}
      userEmail={user.email || "Unknown Operator"}
      fetchError={fetchError}
      onLogout={handleLogout}
    />
  );
}

