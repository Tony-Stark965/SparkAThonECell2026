import { redirect } from "next/navigation";
import { getAuthenticatedJudge, getJudgeTeamDossier } from "@/lib/supabase/judge";
import { JudgingWorkspaceClient } from "../../components/JudgingWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function JudgeTeamPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: registrationId } = await props.params;

  if (!registrationId) {
    redirect("/judge");
  }

  // 1. Authenticate judge
  const authResult = await getAuthenticatedJudge();
  if (!authResult.authorized || !authResult.judge) {
    redirect("/judge/login");
  }

  const judge = authResult.judge;

  // 2. Fetch team dossier with STRICT SERVER-SIDE ASSIGNMENT VERIFICATION
  let dossier = null;
  try {
    dossier = await getJudgeTeamDossier(judge.id, registrationId);
  } catch (err) {
    console.error("[Judge Team Page] Error retrieving team dossier:", err);
  }

  // If the team is not assigned to this judge, immediately deny access
  if (!dossier) {
    redirect("/judge?error=unauthorized_team");
  }

  return <JudgingWorkspaceClient initialDossier={dossier} />;
}
