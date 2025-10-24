import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect root to appropriate dashboard based on active role (only if authenticated)
    if (path === '/') {
      if (token) {
        if (token.activeRole === 'ATHLETE') {
          return NextResponse.redirect(new URL('/athlete/dashboard', req.url));
        } else if (token.activeRole === 'TRAINER' || token.activeRole === 'ADMIN') {
          return NextResponse.redirect(new URL('/trainer/dashboard', req.url));
        }
      }
      // If not authenticated, allow access to the landing page
      return NextResponse.next();
    }

    // Protect athlete routes
    if (path.startsWith('/athlete')) {
      if (token?.activeRole !== 'ATHLETE') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Protect trainer routes
    if (path.startsWith('/trainer')) {
      if (token?.activeRole !== 'TRAINER' && token?.activeRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Protect admin routes (under /trainer/admin)
    if (path.startsWith('/trainer/admin')) {
      if (token?.activeRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    // Protect API routes
    if (path.startsWith('/api/athlete')) {
      if (token?.activeRole !== 'ATHLETE') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/api/trainer')) {
      if (token?.activeRole !== 'TRAINER' && token?.activeRole !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    if (path.startsWith('/api/admin')) {
      if (token?.activeRole !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow public routes
        if (
          path === '/' ||
          path === '/login' ||
          path === '/register' ||
          path === '/unauthorized' ||
          path.startsWith('/api/auth') ||
          path.startsWith('/api/register')
        ) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/athlete/:path*',
    '/trainer/:path*',
    '/api/athlete/:path*',
    '/api/trainer/:path*',
    '/api/admin/:path*',
  ],
};