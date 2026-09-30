import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerAuthClient } from "./server";
import type {
  Judge,
  JudgingRubric,
  JudgingEvaluation,
  Participant,
  OfficialDomain,
} from "./types";

export type { Judge, JudgingRubric, JudgingEvaluation, Participant, OfficialDomain };

// Ensure this module cannot be bundled or executed on the client
if (typeof window !== "undefined") {
  throw new Error("lib/supabase/judge.ts can only be executed on the server.");
}

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment credentials.");
  }

  const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  return createSupabaseClient(cleanUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface JudgeAssignedTeam {
  id: string;
  team_name: string;
  college: string;
  domain: string;
  participant_count: number;
  team_leader_name: string;
  team_leader_roll_no?: string | null;
  team_leader_mobile: string;
  team_leader_email?: string | null;
  participants: Participant[];
  status: "standby" | "in_progress" | "submitted";
  evaluation_id?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
  total_score?: number | null;
}

export interface JudgeTeamDossier {
  team: {
    id: string;
    team_name: string;
    college: string;
    domain: string;
    participant_count: number;
    team_leader_name: string;
    team_leader_mobile: string;
    team_leader_email?: string | null;
    team_leader_roll_no?: string | null;
    participants: Participant[];
    created_at: string;
  };
  judge: {
    id: string;
    name: string;
    email: string;
    domain: OfficialDomain;
  };
  rubrics: JudgingRubric[];
  evaluation: JudgingEvaluation;
  scores: Record<string, number>; // rubric_id -> score
}

export interface JudgeDashboardStats {
  assigned: number;
  completed: number;
  inProgress: number;
  remaining: number;
}

export interface AuthenticatedJudgeResult {
  authorized: boolean;
  error?: string;
  judge?: Judge;
  userId?: string;
}

/**
 * Server-only verification of the active authenticated judge session.
 * 1. Validates Supabase Auth session via cookies.
 * 2. Locates corresponding public.judges record (preferring auth_user_id, then matching email).
 * 3. Enforces that judge is active.
 * 4. Binds auth_user_id if not yet linked.
 */
export async function getAuthenticatedJudge(): Promise<AuthenticatedJudgeResult> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return { authorized: false, error: "Authentication required. Please log in." };
    }

    const authClient = await createServerAuthClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return { authorized: false, error: "Authentication required. Please log in." };
    }

    const admin = getAdminClient();
    let userEmail = (
      user.email ||
      (user.user_metadata?.email as string) ||
      (user.app_metadata?.email as string) ||
      ""
    ).trim().toLowerCase();

    // If userEmail is still empty, look up user from Supabase auth admin directly
    if (!userEmail && user.id) {
      try {
        const { data: adminUserData } = await admin.auth.admin.getUserById(user.id);
        if (adminUserData?.user?.email) {
          userEmail = adminUserData.user.email.trim().toLowerCase();
        }
      } catch (authFetchErr) {
        console.warn("[Judge Auth] Notice retrieving user details by ID:", authFetchErr);
      }
    }

    // 1. Look for judge by auth_user_id
    const { data: byAuthId, error: errAuthId } = await admin
      .from("judges")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (errAuthId) {
      console.error("[Judge Auth] Error querying judge by auth_user_id:", errAuthId.message);
    }

    let judgeRecord = byAuthId as Judge | null;

    // 2. If not found by auth_user_id, match by email
    if (!judgeRecord && userEmail) {
      const { data: byEmail, error: errEmail } = await admin
        .from("judges")
        .select("*")
        .ilike("email", userEmail)
        .maybeSingle();

      if (errEmail) {
        console.error("[Judge Auth] Error querying judge by email:", errEmail.message);
      }

      if (byEmail) {
        judgeRecord = byEmail as Judge;
        // Bind auth_user_id to the judge record for future RLS & lookups
        await admin
          .from("judges")
          .update({
            auth_user_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", judgeRecord.id);

        judgeRecord.auth_user_id = user.id;
      }
    }

    if (!judgeRecord) {
      return {
        authorized: false,
        error: "Access Denied: Your account is not registered as an official Spark-A-Thon judge.",
        userId: user.id,
      };
    }

    if (!judgeRecord.is_active) {
      return {
        authorized: false,
        error: "Access Denied: Your judge account is inactive. Please contact event administration.",
        userId: user.id,
      };
    }

    return {
      authorized: true,
      judge: judgeRecord,
      userId: user.id,
    };
  } catch (err) {
    console.error("[Judge Auth] Verification exception:", err);
    return {
      authorized: false,
      error: "Authentication service error. Please try again.",
    };
  }
}

/**
 * Server-only fetcher for teams assigned to the logged-in judge.
 * Retrieves only assigned teams from public.judge_team_assignments and public.registrations.
 * Fetches judging status: standby, in_progress, or submitted.
 */
export async function getJudgeAssignedTeams(judgeId: string): Promise<{
  teams: JudgeAssignedTeam[];
  stats: JudgeDashboardStats;
}> {
  const admin = getAdminClient();

  // 1. Fetch assignments for this judge
  const { data: assignments, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("registration_id")
    .eq("judge_id", judgeId);

  if (assignErr) {
    console.error("[Judge API] Error fetching assignments:", assignErr.message);
    throw new Error("Failed to load assigned teams.");
  }

  if (!assignments || assignments.length === 0) {
    return {
      teams: [],
      stats: { assigned: 0, completed: 0, inProgress: 0, remaining: 0 },
    };
  }

  const assignedRegIds = assignments.map((a) => a.registration_id);

  // 2. Fetch registrations & evaluations in parallel
  const [{ data: regs, error: regsErr }, { data: evals, error: evalsErr }] =
    await Promise.all([
      admin
        .from("registrations")
        .select(
          "id, team_name, college, domain, participant_count, team_leader_name, team_leader_roll_no, team_leader_mobile, team_leader_email, participants"
        )
        .in("id", assignedRegIds),
      admin
        .from("judging_evaluations")
        .select("id, registration_id, status, started_at, submitted_at, total_score")
        .eq("judge_id", judgeId)
        .in("registration_id", assignedRegIds),
    ]);

  if (regsErr) {
    console.error("[Judge API] Error fetching assigned registrations:", regsErr.message);
    throw new Error("Failed to load team details.");
  }
  if (evalsErr) {
    console.warn("[Judge API] Notice fetching evaluations:", evalsErr.message);
  }

  const evalMap = new Map<string, JudgingEvaluation>();
  (evals || []).forEach((ev) => {
    evalMap.set(ev.registration_id, ev as JudgingEvaluation);
  });

  let completed = 0;
  let inProgress = 0;

  const teams: JudgeAssignedTeam[] = (regs || []).map((r) => {
    const evaluation = evalMap.get(r.id);
    let status: "standby" | "in_progress" | "submitted" = "standby";

    if (evaluation?.status === "submitted") {
      status = "submitted";
      completed++;
    } else if (evaluation?.status === "in_progress") {
      status = "in_progress";
      inProgress++;
    }

    return {
      id: r.id,
      team_name: r.team_name,
      college: r.college,
      domain: r.domain || "Unassigned",
      participant_count: Number(r.participant_count) || (r.participants?.length || 0),
      team_leader_name: r.team_leader_name,
      team_leader_roll_no: r.team_leader_roll_no,
      team_leader_mobile: r.team_leader_mobile,
      team_leader_email: r.team_leader_email,
      participants: (r.participants || []) as Participant[],
      status,
      evaluation_id: evaluation?.id || null,
      started_at: evaluation?.started_at || null,
      submitted_at: evaluation?.submitted_at || null,
      total_score: evaluation?.total_score != null ? Number(evaluation.total_score) : null,
    };
  });

  const totalAssigned = teams.length;
  const remaining = Math.max(0, totalAssigned - completed);

  return {
    teams,
    stats: {
      assigned: totalAssigned,
      completed,
      inProgress,
      remaining,
    },
  };
}

/**
 * Server-only fetcher for a specific assigned team dossier and active judging workspace.
 * STRICT SECURITY INVARIANT:
 * Verifies that the team is assigned to this specific judge.
 * Rejects access if unassigned.
 */
export async function getJudgeTeamDossier(
  judgeId: string,
  registrationId: string
): Promise<JudgeTeamDossier | null> {
  const admin = getAdminClient();

  // 1. Verify Assignment
  const { data: assignment, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("id")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (assignErr || !assignment) {
    return null; // Not assigned or invalid
  }

  // 2. Fetch Judge, Registration, Rubrics, and Evaluation in parallel
  const [
    { data: judgeData, error: judgeErr },
    { data: regData, error: regErr },
    { data: rubricsData, error: rubricsErr },
    { data: evalData, error: evalErr },
  ] = await Promise.all([
    admin.from("judges").select("id, name, email, domain").eq("id", judgeId).single(),
    admin
      .from("registrations")
      .select(
        "id, team_name, college, domain, participant_count, team_leader_name, team_leader_mobile, team_leader_email, team_leader_roll_no, participants, created_at"
      )
      .eq("id", registrationId)
      .single(),
    admin
      .from("judging_rubrics")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    admin
      .from("judging_evaluations")
      .select("*")
      .eq("judge_id", judgeId)
      .eq("registration_id", registrationId)
      .maybeSingle(),
  ]);

  if (judgeErr || !judgeData || regErr || !regData) {
    throw new Error("Failed to load dossier components.");
  }
  if (rubricsErr) {
    throw new Error("Failed to load active judging rubrics.");
  }
  if (evalErr) {
    console.warn("[Judge API] Notice querying evaluation:", evalErr.message);
  }

  let evaluation = evalData as JudgingEvaluation | null;

  // 3. If no evaluation exists yet, create one in draft status
  if (!evaluation) {
    const { data: newEval, error: createEvalErr } = await admin
      .from("judging_evaluations")
      .insert({
        judge_id: judgeId,
        registration_id: registrationId,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createEvalErr || !newEval) {
      throw new Error(`Failed to initialize evaluation: ${createEvalErr?.message || "Unknown error"}`);
    }
    evaluation = newEval as JudgingEvaluation;
  }

  // 4. Fetch existing scores for this evaluation
  const scoresMap: Record<string, number> = {};
  if (evaluation?.id) {
    const { data: scoresData, error: scoresErr } = await admin
      .from("judging_scores")
      .select("rubric_id, score")
      .eq("evaluation_id", evaluation.id);

    if (!scoresErr && scoresData) {
      scoresData.forEach((s) => {
        scoresMap[s.rubric_id] = Number(s.score);
      });
    }
  }

  return {
    team: {
      id: regData.id,
      team_name: regData.team_name,
      college: regData.college,
      domain: regData.domain || judgeData.domain,
      participant_count: Number(regData.participant_count) || (regData.participants?.length || 0),
      team_leader_name: regData.team_leader_name,
      team_leader_mobile: regData.team_leader_mobile,
      team_leader_email: regData.team_leader_email,
      team_leader_roll_no: regData.team_leader_roll_no,
      participants: (regData.participants || []) as Participant[],
      created_at: regData.created_at,
    },
    judge: {
      id: judgeData.id,
      name: judgeData.name,
      email: judgeData.email,
      domain: judgeData.domain as OfficialDomain,
    },
    rubrics: (rubricsData || []) as JudgingRubric[],
    evaluation,
    scores: scoresMap,
  };
}

/**
 * Server-only start session handler.
 * Marks evaluation as 'in_progress' and records started_at timestamp if not already started.
 */
export async function startJudgingSession(
  judgeId: string,
  registrationId: string
): Promise<JudgingEvaluation> {
  const admin = getAdminClient();

  // 1. Verify assignment
  const { data: assignment, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("id")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (assignErr || !assignment) {
    throw new Error("Unauthorized: You are not assigned to evaluate this team.");
  }

  // 2. Fetch existing evaluation
  const { data: existingEval, error: fetchErr } = await admin
    .from("judging_evaluations")
    .select("*")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Failed to check evaluation status: ${fetchErr.message}`);
  }

  if (existingEval) {
    if (existingEval.status === "submitted") {
      return existingEval as JudgingEvaluation;
    }

    // If started_at is already set, preserve it! Do NOT reset timer on re-entry.
    if (existingEval.started_at) {
      if (existingEval.status !== "in_progress") {
        const { data: updated } = await admin
          .from("judging_evaluations")
          .update({
            status: "in_progress",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingEval.id)
          .select()
          .single();
        return (updated || existingEval) as JudgingEvaluation;
      }
      return existingEval as JudgingEvaluation;
    }

    // Set started_at for the first time
    const { data: updated, error: updateErr } = await admin
      .from("judging_evaluations")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingEval.id)
      .select()
      .single();

    if (updateErr || !updated) {
      throw new Error(`Failed to start judging session: ${updateErr?.message || "Unknown error"}`);
    }

    return updated as JudgingEvaluation;
  }

  // Insert fresh evaluation with started_at
  const { data: inserted, error: insertErr } = await admin
    .from("judging_evaluations")
    .insert({
      judge_id: judgeId,
      registration_id: registrationId,
      status: "in_progress",
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to initialize judging session: ${insertErr?.message || "Unknown error"}`);
  }

  return inserted as JudgingEvaluation;
}

/**
 * Server-only reset session handler.
 * Resets an in-progress or draft evaluation session back to standby.
 * Submitted evaluations cannot be reset.
 */
export async function resetJudgingSession(
  judgeId: string,
  registrationId: string
): Promise<{ success: boolean; message: string }> {
  const admin = getAdminClient();

  // 1. Verify judge assignment
  const { data: assignment, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("id")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (assignErr || !assignment) {
    throw new Error("Unauthorized: You are not assigned to evaluate this team.");
  }

  // 2. Fetch existing evaluation
  const { data: existingEval, error: fetchErr } = await admin
    .from("judging_evaluations")
    .select("id, status")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Failed to check evaluation status: ${fetchErr.message}`);
  }

  if (!existingEval) {
    return { success: true, message: "No active evaluation session found." };
  }

  if (existingEval.status === "submitted") {
    throw new Error("Cannot reset an evaluation that has already been submitted and locked.");
  }

  // 3. Clear draft scores and remove the unsubmitted evaluation
  await admin.from("judging_scores").delete().eq("evaluation_id", existingEval.id);
  const { error: deleteErr } = await admin
    .from("judging_evaluations")
    .delete()
    .eq("id", existingEval.id);

  if (deleteErr) {
    throw new Error(`Failed to reset evaluation session: ${deleteErr.message}`);
  }

  return { success: true, message: "Evaluation session reset to standby successfully." };
}

/**
 * Server-only draft save handler.
 * Saves rubric scores and judge feedback without finalizing.
 * Calculates total score authoritative on the server.
 * Rejects if evaluation is already submitted.
 */
export async function saveJudgingDraft(
  judgeId: string,
  registrationId: string,
  payload: {
    scores: Record<string, number>;
    feedback?: string;
  }
): Promise<{
  success: boolean;
  total_score: number;
  evaluation: JudgingEvaluation;
}> {
  const admin = getAdminClient();

  // 1. Verify assignment
  const { data: assignment, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("id")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (assignErr || !assignment) {
    throw new Error("Unauthorized: You are not assigned to evaluate this team.");
  }

  // 2. Fetch evaluation
  const { data: evaluation, error: evalErr } = await admin
    .from("judging_evaluations")
    .select("*")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .single();

  if (evalErr || !evaluation) {
    throw new Error("Evaluation record not found. Please start judging first.");
  }

  // 3. Strict Locking: Submitted evaluations cannot be edited
  if (evaluation.status === "submitted") {
    throw new Error("Security Violation: This evaluation has already been submitted and is locked.");
  }

  // 4. Fetch active rubrics for validation
  const { data: rubrics, error: rubricsErr } = await admin
    .from("judging_rubrics")
    .select("*")
    .eq("is_active", true);

  if (rubricsErr || !rubrics) {
    throw new Error("Failed to load active rubrics.");
  }

  const rubricMap = new Map(rubrics.map((r) => [r.id, r]));

  // 5. Validate and upsert scores
  let computedTotal = 0;
  const scoreEntries = Object.entries(payload.scores || {});

  for (const [rubricId, rawScore] of scoreEntries) {
    const rubric = rubricMap.get(rubricId);
    if (!rubric) continue; // Skip unknown/inactive rubrics

    const scoreNum = Number(rawScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > rubric.max_score) {
      throw new Error(
        `Invalid score for '${rubric.name}'. Score must be between 0 and ${rubric.max_score}.`
      );
    }

    computedTotal += scoreNum;

    // Upsert score
    const { error: scoreErr } = await admin
      .from("judging_scores")
      .upsert(
        {
          evaluation_id: evaluation.id,
          rubric_id: rubricId,
          score: scoreNum,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "evaluation_id,rubric_id" }
      );

    if (scoreErr) {
      console.error("[Judge API] Error upserting score:", scoreErr.message);
      throw new Error(`Failed to save score for ${rubric.name}.`);
    }
  }

  // 6. Update evaluation draft
  const updates: Record<string, unknown> = {
    total_score: Math.round(computedTotal * 100) / 100,
    updated_at: new Date().toISOString(),
  };

  if (payload.feedback !== undefined) {
    updates.feedback = payload.feedback.trim() || null;
  }

  if (evaluation.status === "draft") {
    updates.status = "in_progress";
  }

  const { data: updatedEval, error: updateErr } = await admin
    .from("judging_evaluations")
    .update(updates)
    .eq("id", evaluation.id)
    .select()
    .single();

  if (updateErr || !updatedEval) {
    throw new Error(`Failed to save draft: ${updateErr?.message || "Unknown error"}`);
  }

  return {
    success: true,
    total_score: Math.round(computedTotal * 100) / 100,
    evaluation: updatedEval as JudgingEvaluation,
  };
}

/**
 * Server-only final evaluation submit handler.
 * STRICT SERVER-SIDE VALIDATION:
 * 1. Verifies session, active judge, and team assignment.
 * 2. Enforces that EVERY active rubric criterion has a valid score.
 * 3. Authoritatively calculates final total score.
 * 4. Permanently locks evaluation: status = 'submitted', submitted_at = now().
 * 5. Rejects any subsequent modification attempts.
 */
export async function submitJudgingEvaluation(
  judgeId: string,
  registrationId: string,
  payload: {
    scores: Record<string, number>;
    feedback?: string;
  }
): Promise<{
  success: boolean;
  total_score: number;
  submitted_at: string;
  evaluation: JudgingEvaluation;
}> {
  const admin = getAdminClient();

  // 1. Verify assignment
  const { data: assignment, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("id")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (assignErr || !assignment) {
    throw new Error("Unauthorized: You are not assigned to evaluate this team.");
  }

  // 2. Fetch evaluation
  const { data: evaluation, error: evalErr } = await admin
    .from("judging_evaluations")
    .select("*")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .single();

  if (evalErr || !evaluation) {
    throw new Error("Evaluation record not found. Please start judging first.");
  }

  // 3. Strict Lock Check
  if (evaluation.status === "submitted") {
    throw new Error("Evaluation is already finalized and submitted.");
  }

  // 4. Fetch all active rubrics
  const { data: rubrics, error: rubricsErr } = await admin
    .from("judging_rubrics")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (rubricsErr || !rubrics || rubrics.length === 0) {
    throw new Error("No active judging rubrics found.");
  }

  // 5. Authoritative Validation: Every rubric MUST have a valid score
  let authoritativeTotal = 0;
  const providedScores = payload.scores || {};

  for (const rubric of rubrics) {
    const rawScore = providedScores[rubric.id];
    if (rawScore === undefined || rawScore === null) {
      throw new Error(
        `Incomplete Evaluation: Missing score for '${rubric.name}'. All ${rubrics.length} criteria must be scored.`
      );
    }

    const scoreNum = Number(rawScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > rubric.max_score) {
      throw new Error(
        `Invalid score for '${rubric.name}'. Must be between 0 and ${rubric.max_score}.`
      );
    }

    authoritativeTotal += scoreNum;

    // Upsert score
    const { error: scoreErr } = await admin
      .from("judging_scores")
      .upsert(
        {
          evaluation_id: evaluation.id,
          rubric_id: rubric.id,
          score: scoreNum,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "evaluation_id,rubric_id" }
      );

    if (scoreErr) {
      console.error("[Judge API] Error upserting submission score:", scoreErr.message);
      throw new Error(`Failed to record score for ${rubric.name}.`);
    }
  }

  const finalTotal = Math.round(authoritativeTotal * 100) / 100;
  const submittedAt = new Date().toISOString();

  // 6. Permanently lock evaluation
  const { data: updatedEval, error: updateErr } = await admin
    .from("judging_evaluations")
    .update({
      status: "submitted",
      total_score: finalTotal,
      feedback: (payload.feedback || "").trim() || null,
      submitted_at: submittedAt,
      updated_at: submittedAt,
    })
    .eq("id", evaluation.id)
    .select()
    .single();

  if (updateErr || !updatedEval) {
    throw new Error(`Failed to finalize evaluation: ${updateErr?.message || "Unknown error"}`);
  }

  // 7. Check if this submission completes an approved correction request
  try {
    const { data: approvedReq } = await admin
      .from("judging_correction_requests")
      .select("id")
      .eq("evaluation_id", evaluation.id)
      .eq("status", "approved")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedReq) {
      await admin
        .from("judging_correction_requests")
        .update({
          status: "completed",
          revised_total_score: finalTotal,
          revised_scores_snapshot: providedScores,
          updated_at: submittedAt,
        })
        .eq("id", approvedReq.id);
    }
  } catch (crErr) {
    console.warn("[Judge API] Notice: Could not update correction request status:", crErr);
  }

  return {
    success: true,
    total_score: finalTotal,
    submitted_at: submittedAt,
    evaluation: updatedEval as JudgingEvaluation,
  };
}

/**
 * Server-only evaluation correction request handler.
 * Allows a judge to file a formal correction request for a locked submission.
 * Enforces assignment and submitted status.
 * Preserves the locked status while awaiting Phase 4 admin approval.
 * Snapshots original rubric scores and inserts into judging_correction_requests.
 */
export async function requestJudgingCorrection(
  judgeId: string,
  registrationId: string,
  payload: {
    reason: string;
    explanation: string;
  }
): Promise<{
  success: boolean;
  message: string;
  requestId: string;
  requestedAt: string;
  status: "pending_admin_approval";
}> {
  const admin = getAdminClient();

  // 1. Verify assignment
  const { data: assignment, error: assignErr } = await admin
    .from("judge_team_assignments")
    .select("id")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .maybeSingle();

  if (assignErr || !assignment) {
    throw new Error("Unauthorized: You are not assigned to evaluate this team.");
  }

  // 2. Fetch evaluation
  const { data: evaluation, error: evalErr } = await admin
    .from("judging_evaluations")
    .select("id, status, total_score, feedback")
    .eq("judge_id", judgeId)
    .eq("registration_id", registrationId)
    .single();

  if (evalErr || !evaluation) {
    throw new Error("Evaluation record not found.");
  }

  if (evaluation.status !== "submitted") {
    throw new Error("Correction requests can only be filed for submitted, locked evaluations.");
  }

  // 3. Validate input
  const reason = (payload.reason || "").trim();
  const explanation = (payload.explanation || "").trim();

  if (!reason) {
    throw new Error("A reason must be selected for the correction request.");
  }

  if (!explanation || explanation.length < 10) {
    throw new Error("Please provide a detailed explanation of the correction (minimum 10 characters).");
  }

  const requestId = `CORR-${evaluation.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const requestedAt = new Date().toISOString();

  // 4. Snapshot current rubric scores
  const scoreSnapshot: Record<string, number> = {};
  try {
    const { data: currentScores } = await admin
      .from("judging_scores")
      .select("rubric_id, score")
      .eq("evaluation_id", evaluation.id);

    if (currentScores && Array.isArray(currentScores)) {
      for (const cs of currentScores) {
        scoreSnapshot[cs.rubric_id] = Number(cs.score) || 0;
      }
    }
  } catch (snapErr) {
    console.warn("[Judge API] Notice: Could not snapshot scores:", snapErr);
  }

  // 5. Attempt insertion into dedicated judging_correction_requests table
  try {
    await admin.from("judging_correction_requests").insert({
      evaluation_id: evaluation.id,
      judge_id: judgeId,
      registration_id: registrationId,
      reason,
      explanation,
      status: "pending",
      original_total_score: evaluation.total_score,
      original_scores_snapshot: scoreSnapshot,
      requested_at: requestedAt,
      created_at: requestedAt,
      updated_at: requestedAt,
    });
  } catch (insertErr) {
    console.warn("[Judge API] Notice: Could not insert to judging_correction_requests:", insertErr);
  }

  // 6. Persist official audit note directly in judging_evaluations feedback as secondary defense
  const auditHeader = `[CORRECTION REQUEST: ${requestId}]`;
  const existingFeedback = (evaluation.feedback || "").trim();
  const correctionNote = `${auditHeader}\nReason: ${reason}\nExplanation: ${explanation}\nSubmitted At: ${requestedAt}`;

  const updatedFeedback = existingFeedback
    ? `${existingFeedback}\n\n${correctionNote}`
    : correctionNote;

  const { error: updateErr } = await admin
    .from("judging_evaluations")
    .update({
      feedback: updatedFeedback,
      updated_at: requestedAt,
    })
    .eq("id", evaluation.id);

  if (updateErr) {
    console.error("[Judge API] Error persisting correction request:", updateErr.message);
    throw new Error("Failed to record correction request in database.");
  }

  return {
    success: true,
    message: "Correction request registered successfully. Awaiting Phase 4 Admin review.",
    requestId,
    requestedAt,
    status: "pending_admin_approval",
  };
}

/**
 * Server-only judge account activator.
 * Allows an officially onboarded judge to set up their password.
 * Strictly verifies that the email already exists in public.judges and is_active = true.
 */
export async function activateJudgeAccount(payload: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string; judge: Judge }> {
  const admin = getAdminClient();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  // 1. Verify existence in public.judges
  const { data: judge, error: judgeErr } = await admin
    .from("judges")
    .select("*")
    .ilike("email", email)
    .maybeSingle();

  if (judgeErr || !judge) {
    throw new Error("Access Denied: This email is not registered as an official Spark-A-Thon judge.");
  }

  if (!judge.is_active) {
    throw new Error("Access Denied: This judge account is inactive. Please contact event organizers.");
  }

  // 2. Check if auth user already exists or create new one
  try {
    // List users to check existence
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) {
      console.warn("[Judge Auth Admin] List users notice:", listErr.message);
    }

    const existingUser = (listData?.users || []).find(
      (u) => (u.email || "").toLowerCase() === email
    );

    let authUserId: string;

    if (existingUser) {
      // Update existing user password
      const { data: updated, error: updateErr } = await admin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
        }
      );
      if (updateErr || !updated.user) {
        throw new Error(`Failed to update judge password: ${updateErr?.message || "Unknown error"}`);
      }
      authUserId = updated.user.id;
    } else {
      // Create new Supabase auth user
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr || !created.user) {
        throw new Error(`Failed to initialize judge credentials: ${createErr?.message || "Unknown error"}`);
      }
      authUserId = created.user.id;
    }

    // 3. Link auth_user_id in public.judges
    const { data: updatedJudge, error: linkErr } = await admin
      .from("judges")
      .update({
        auth_user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", judge.id)
      .select()
      .single();

    if (linkErr || !updatedJudge) {
      console.error("[Judge Auth] Failed to link auth_user_id:", linkErr?.message);
    }

    return {
      success: true,
      message: "Judge account credentials verified and activated successfully.",
      judge: (updatedJudge || judge) as Judge,
    };
  } catch (authError) {
    console.error("[Judge Auth Activation Error]:", authError);
    const msg = authError instanceof Error ? authError.message : "Account activation failed.";
    throw new Error(msg);
  }
}
