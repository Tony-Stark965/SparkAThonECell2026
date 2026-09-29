import { redirect } from "next/navigation";
import { getAuthenticatedJudge, getJudgeAssignedTeams } from "@/lib/supabase/judge";
import { createClient } from "@/lib/supabase/server";
import { JudgeDashboardClient } from "./components/JudgeDashboardClient";

export const dynamic = "force-dynamic";

export default async function JudgeDashboardPage() {
  // 1. Authenticate and Authorize Judge
  const authResult = await getAuthenticatedJudge();

  if (!authResult.authorized || !authResult.judge) {
    redirect("/judge/login");
  }

  const judge = authResult.judge;

  // 2. Server Action for Judge Logout
  async function handleLogout() {
    "use server";
    const serverSupabase = await createClient();
    await serverSupabase.auth.signOut();
    redirect("/judge/login");
  }

  // 3. Fetch Assigned Teams and Dashboard Statistics
  let initialTeams: Awaited<ReturnType<typeof getJudgeAssignedTeams>>["teams"] = [];
  let initialStats: Awaited<ReturnType<typeof getJudgeAssignedTeams>>["stats"] = {
    assigned: 0,
    completed: 0,
    inProgress: 0,
    remaining: 0,
  };

  try {
    const data = await getJudgeAssignedTeams(judge.id);
    initialTeams = data.teams;
    initialStats = data.stats;
  } catch (err) {
    console.error("[Judge Dashboard Page] Error fetching assigned teams:", err);
  }

  return (
    <JudgeDashboardClient
      judge={judge}
      initialTeams={initialTeams}
      initialStats={initialStats}
      onLogout={handleLogout}
    />
  );
}
