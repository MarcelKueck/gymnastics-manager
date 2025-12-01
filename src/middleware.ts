import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Athlete routes
    if (path.startsWith('/athlete')) {
      if (token?.activeRole !== 'ATHLETE') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Trainer routes (including admin)
    if (path.startsWith('/trainer')) {
      const role = token?.activeRole;
      if (role !== 'TRAINER' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      // Admin-only routes within trainer section
      if (path.startsWith('/trainer/admin') && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/athlete/:path*', '/trainer/:path*'],
};
