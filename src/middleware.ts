// Save as: src/middleware.ts

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public routes - always allow
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/unauthorized",
    "/api/auth/signin",
    "/api/auth/callback",
    "/api/auth/error",
  ];

  // Check if path is public or is an API auth route
  if (
    publicRoutes.includes(path) ||
    path.startsWith("/api/auth") ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Require authentication for protected routes
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Athlete routes - only athletes can access
  if (path.startsWith("/athlete")) {
    if (token.userType !== "athlete") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Trainer routes - only trainers and admins can access
  if (path.startsWith("/trainer")) {
    if (token.userType !== "trainer" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};