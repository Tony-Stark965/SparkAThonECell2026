import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually without external dependencies
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const email = "judge.demo@sparkathon.test";
  const password = "SparkJudge#2026!";
  const name = "Demo Judge";
  const domain = "AI and Cybersec";

  console.log(`[1/4] Checking Supabase Auth for ${email}...`);
  let authUserId = null;
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list auth users: ${listError.message}`);
  }

  const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    console.log(`Auth user already exists (${existingUser.id}). Updating password and ensuring confirmed...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: { name, role: "judge" },
    });
    if (updateError) throw updateError;
    authUserId = existingUser.id;
  } else {
    console.log(`Creating new auth user for ${email}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: "judge" },
    });
    if (createError) throw createError;
    authUserId = newUser.user.id;
  }

  console.log(`[2/4] Upserting judge profile in public.judges...`);
  const { data: existingJudge } = await supabase
    .from("judges")
    .select("id, email, is_active")
    .eq("email", email)
    .maybeSingle();

  let judgeId = existingJudge?.id;
  if (existingJudge) {
    const { error: judgeUpdateErr } = await supabase
      .from("judges")
      .update({
        name,
        domain,
        is_active: true,
        auth_user_id: authUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", judgeId);
    if (judgeUpdateErr) throw judgeUpdateErr;
  } else {
    const { data: newJudge, error: judgeInsertErr } = await supabase
      .from("judges")
      .insert({
        name,
        email,
        domain,
        is_active: true,
        auth_user_id: authUserId,
      })
      .select("id")
      .single();
    if (judgeInsertErr) throw judgeInsertErr;
    judgeId = newJudge.id;
  }

  console.log(`[3/4] Ensuring active judge team assignment...`);
  // Check existing assignments for this judge
  const { data: existingAssignments } = await supabase
    .from("judge_team_assignments")
    .select("id, registration_id")
    .eq("judge_id", judgeId);

  if (!existingAssignments || existingAssignments.length === 0) {
    // Look for real registrations in AI and Cybersec domain first
    let { data: realTeams } = await supabase
      .from("registrations")
      .select("id, team_name, domain")
      .eq("domain", "AI and Cybersec")
      .limit(2);

    if (!realTeams || realTeams.length === 0) {
      // Fallback to any real registrations
      const { data: anyTeams } = await supabase
        .from("registrations")
        .select("id, team_name, domain")
        .limit(2);
      realTeams = anyTeams;
    }

    if (realTeams && realTeams.length > 0) {
      for (const t of realTeams) {
        await supabase.from("judge_team_assignments").insert({
          judge_id: judgeId,
          registration_id: t.id,
        });
        console.log(`Assigned team "${t.team_name}" (${t.id}) to Demo Judge.`);
      }
    } else {
      console.log("No registrations found in database to assign.");
    }
  } else {
    console.log(`Demo Judge already has ${existingAssignments.length} assigned team(s).`);
  }

  console.log(`[4/4] Verifying rubrics are populated...`);
  const { data: rubrics, error: rubricsErr } = await supabase
    .from("judging_rubrics")
    .select("id, name, max_score")
    .eq("is_active", true);

  if (rubricsErr) {
    console.warn("Warning fetching rubrics:", rubricsErr.message);
  } else {
    console.log(`Found ${rubrics?.length || 0} active rubrics.`);
  }

  console.log("SUCCESS: Demo Judge provisioned and verified.");
}

main().catch((err) => {
  console.error("Error provisioning test judge:", err);
  process.exit(1);
});
