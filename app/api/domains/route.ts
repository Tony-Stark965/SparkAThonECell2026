import { NextResponse } from "next/server";
import { SPARKATHON_CONFIG } from "@/config/sparkathon.config";

export const runtime = "nodejs";

// In-memory development capacities (when Supabase is missing)
const DEV_CAPACITIES = {
  "AI and Cybersec": 0,
  "Smart Energy Systems": 0,
  "Robotics or Drone and Fixed Wing": 0,
  "IoT or Embedded Systems": 0,
  "Open Innovation": 0,
};

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

    const domainCapacities: Record<string, number> = {
      "AI and Cybersec": 0,
      "Smart Energy Systems": 0,
      "Robotics or Drone and Fixed Wing": 0,
      "IoT or Embedded Systems": 0,
      "Open Innovation": 0,
    };

    if (isSupabaseConfigured) {
      const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
      
      // Query registrations to count successful teams per domain
      const response = await fetch(`${cleanBaseUrl}/rest/v1/registrations?select=domain&payment_status=eq.completed`, {
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
    } else {
      // Fallback to dev capacities
      Object.assign(domainCapacities, DEV_CAPACITIES);
    }

    return NextResponse.json(domainCapacities);
  } catch (error) {
    console.error("Domain capacities route error:", error);
    // Return zeroes safely on failure rather than crashing
    return NextResponse.json({
      "AI and Cybersec": 0,
      "Smart Energy Systems": 0,
      "Robotics or Drone and Fixed Wing": 0,
      "IoT or Embedded Systems": 0,
      "Open Innovation": 0,
    });
  }
}
