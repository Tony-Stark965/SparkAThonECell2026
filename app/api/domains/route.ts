import { NextResponse } from "next/server";
import { OFFICIAL_DOMAINS } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    const supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ""
    ).trim();

    const isSupabaseConfigured =
      Boolean(supabaseUrl) &&
      Boolean(supabaseKey) &&
      !supabaseUrl.includes("your-project.supabase.co") &&
      !supabaseKey.includes("your-service-role-key-here") &&
      !supabaseKey.includes("your-anon-key-here");

    const domainCapacities: Record<string, number> = {};
    for (const dom of OFFICIAL_DOMAINS) {
      domainCapacities[dom] = 0;
    }

    if (isSupabaseConfigured) {
      const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
      
      // Query registrations to count registered teams per domain
      const response = await fetch(`${cleanBaseUrl}/rest/v1/registrations?select=domain`, {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        // We use cache: 'no-store' to ensure we get live data
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          for (const record of data) {
            const domain = record.domain;
            if (domain && domainCapacities[domain] !== undefined) {
              domainCapacities[domain]++;
            }
          }
        }
      } else {
        console.warn(`[Supabase Domain Capacity Notice] Status: ${response.status}`);
      }
    }

    return NextResponse.json(domainCapacities);
  } catch (error) {
    console.error("Domain capacities route error:", error);
    const fallback: Record<string, number> = {};
    for (const dom of OFFICIAL_DOMAINS) {
      fallback[dom] = 0;
    }
    return NextResponse.json(fallback);
  }
}
