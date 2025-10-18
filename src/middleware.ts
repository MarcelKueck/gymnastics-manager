import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Trainer routes
    if (path.startsWith('/trainer')) {
      if (token?.role !== 'TRAINER' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Athlete routes
    if (path.startsWith('/athlete')) {
      if (token?.role !== 'ATHLETE') {
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