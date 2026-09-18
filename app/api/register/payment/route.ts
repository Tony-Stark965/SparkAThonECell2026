import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const registrationId = body.registrationId;
    const utr = (body.utr || "").trim();

    if (!registrationId) {
      return NextResponse.json(
        { error: "Registration ID is required." },
        { status: 400 }
      );
    }
    
    if (!utr || utr.length < 5) {
      return NextResponse.json(
        { error: "A valid UTR or Transaction ID is required." },
        { status: 400 }
      );
    }

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

    if (isSupabaseConfigured) {
      try {
        const cleanBaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
        
        const response = await fetch(`${cleanBaseUrl}/rest/v1/registrations?id=eq.${registrationId}`, {
          method: "PATCH",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            payment_reference: utr,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[Supabase Payment Update Error] Status: ${response.status}`, errorBody);
          return NextResponse.json(
            { error: "Database error while saving payment details." },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          message: "Payment reference saved successfully.",
        });
      } catch (err) {
        console.error("Supabase network error:", err instanceof Error ? err.message : "Unknown error");
        return NextResponse.json(
          { error: "Unable to reach production database to save payment." },
          { status: 500 }
        );
      }
    }

    // Dev fallback
    return NextResponse.json({
      success: true,
      mode: "dev_fallback",
      message: "Payment reference saved in dev mode (Supabase not configured).",
    });

  } catch (error) {
    console.error("Payment update route error:", error);
    return NextResponse.json(
      { error: "Invalid payment payload." },
      { status: 400 }
    );
  }
}
