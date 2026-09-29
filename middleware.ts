import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function checkIsAuthorizedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const configuredAdmins = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (configuredAdmins.length === 0) return false;
  return configuredAdmins.includes(email.trim().toLowerCase());
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Only intercept /admin and /judge subroutes
  const isAdminRoute = pathname.startsWith("/admin");
  const isJudgeRoute = pathname.startsWith("/judge");

  if (!isAdminRoute && !isJudgeRoute) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminRoute && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (isJudgeRoute && pathname !== "/judge/login") {
      return NextResponse.redirect(new URL("/judge/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        }
      },
    },
  });

  // Fetch verified user from Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // === ADMIN ROUTE PROTECTION ===
  if (isAdminRoute) {
    const isLoginPage = pathname === "/admin/login";
    const isAuthorized = checkIsAuthorizedAdmin(user?.email);

    if (isLoginPage) {
      if (user && isAuthorized) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return response;
    }

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (!isAuthorized) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/admin/login?error=unauthorized", request.url);
      response = NextResponse.redirect(loginUrl);
      const allCookies = request.cookies.getAll();
      allCookies.forEach((c) => {
        if (c.name.startsWith("sb-")) {
          response.cookies.delete(c.name);
        }
      });
      return response;
    }

    return response;
  }

  // === JUDGE ROUTE PROTECTION ===
  if (isJudgeRoute) {
    const isJudgeLoginPage = pathname === "/judge/login";

    if (isJudgeLoginPage) {
      // If user is already authenticated on /judge/login, allow page to check active judge status
      return response;
    }

    // Protected /judge routes: require authenticated session
    if (!user) {
      return NextResponse.redirect(new URL("/judge/login", request.url));
    }

    return response;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/judge/:path*"],
};
