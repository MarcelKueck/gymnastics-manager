# Authentication & Authorization

## Overview

The application uses NextAuth.js with the Credentials provider for authentication. A key feature is the **dual-role system** allowing users to have both athlete and trainer profiles.

## Authentication Flow

```
┌─────────────┐      ┌───────────────┐      ┌─────────────────┐
│   Login     │──────│  Validate     │──────│  Build Session  │
│   Form      │      │  Credentials  │      │  with Roles     │
└─────────────┘      └───────────────┘      └─────────────────┘
                                                     │
                     ┌───────────────────────────────┤
                     │                               │
              ┌──────▼──────┐                ┌───────▼───────┐
              │  Single     │                │  Multiple     │
              │  Role       │                │  Roles        │
              └──────┬──────┘                └───────┬───────┘
                     │                               │
              ┌──────▼──────┐                ┌───────▼───────┐
              │  Redirect   │                │  Show Role    │
              │  to Dash    │                │  Switcher     │
              └─────────────┘                └───────────────┘
```

## NextAuth Configuration

### Complete Implementation

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[];
      activeRole: 'ATHLETE' | 'TRAINER' | 'ADMIN';
      athleteProfileId?: string;
      trainerProfileId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[];
    athleteProfileId?: string;
    trainerProfileId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[];
    activeRole: 'ATHLETE' | 'TRAINER' | 'ADMIN';
    athleteProfileId?: string;
    trainerProfileId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-Mail und Passwort erforderlich');
        }

        // Find user with profiles
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            athleteProfile: true,
            trainerProfile: true,
          },
        });

        if (!user) {
          throw new Error('Ungültige Anmeldedaten');
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error('Ungültige Anmeldedaten');
        }

        // Check if athlete is approved
        if (user.isAthlete && user.athleteProfile && !user.athleteProfile.isApproved) {
          // If only athlete role and not approved, deny
          if (!user.isTrainer) {
            throw new Error('Ihr Konto wurde noch nicht genehmigt');
          }
        }

        // Build roles array
        const roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[] = [];

        if (user.isAthlete && user.athleteProfile?.isApproved) {
          roles.push('ATHLETE');
        }

        if (user.isTrainer && user.trainerProfile) {
          if (user.trainerProfile.role === 'ADMIN') {
            roles.push('ADMIN');
          } else {
            roles.push('TRAINER');
          }
        }

        if (roles.length === 0) {
          throw new Error('Keine aktiven Rollen gefunden');
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          athleteProfileId: user.athleteProfile?.id,
          trainerProfileId: user.trainerProfile?.id,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.roles = user.roles;
        token.athleteProfileId = user.athleteProfileId;
        token.trainerProfileId = user.trainerProfileId;
        
        // Set default active role (highest privilege)
        if (user.roles.includes('ADMIN')) {
          token.activeRole = 'ADMIN';
        } else if (user.roles.includes('TRAINER')) {
          token.activeRole = 'TRAINER';
        } else {
          token.activeRole = 'ATHLETE';
        }
      }

      // Handle role switch
      if (trigger === 'update' && session?.activeRole) {
        if (token.roles.includes(session.activeRole)) {
          token.activeRole = session.activeRole;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        roles: token.roles,
        activeRole: token.activeRole,
        athleteProfileId: token.athleteProfileId,
        trainerProfileId: token.trainerProfileId,
      };
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
```

### API Route Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## Role Switching

### API Endpoint

```typescript
// src/app/api/auth/switch-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert' },
      { status: 401 }
    );
  }

  const { role } = await request.json();

  // Validate role is available to user
  if (!session.user.roles.includes(role)) {
    return NextResponse.json(
      { error: 'Diese Rolle ist nicht verfügbar' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    activeRole: role,
    message: 'Rolle erfolgreich gewechselt',
  });
}
```

### Client-Side Role Switching

```typescript
// src/components/shared/role-switcher.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, User, GraduationCap, Shield } from 'lucide-react';

const ROLE_LABELS = {
  ATHLETE: 'Athlet',
  TRAINER: 'Trainer',
  ADMIN: 'Administrator',
};

const ROLE_ICONS = {
  ATHLETE: User,
  TRAINER: GraduationCap,
  ADMIN: Shield,
};

const ROLE_ROUTES = {
  ATHLETE: '/athlete/dashboard',
  TRAINER: '/trainer/dashboard',
  ADMIN: '/trainer/dashboard',
};

export function RoleSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!session || session.user.roles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = async (role: 'ATHLETE' | 'TRAINER' | 'ADMIN') => {
    if (role === session.user.activeRole) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        // Update session with new active role
        await update({ activeRole: role });
        // Redirect to appropriate dashboard
        router.push(ROLE_ROUTES[role]);
      }
    } catch (error) {
      console.error('Role switch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ActiveIcon = ROLE_ICONS[session.user.activeRole];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <ActiveIcon className="h-4 w-4 mr-2" />
          {ROLE_LABELS[session.user.activeRole]}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {session.user.roles.map((role) => {
          const Icon = ROLE_ICONS[role];
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={role === session.user.activeRole ? 'bg-accent' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {ROLE_LABELS[role]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Authorization Helpers

### API Route Helpers

```typescript
// src/lib/api/auth.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth';

type AuthSession = Awaited<ReturnType<typeof getServerSession<typeof authOptions>>>;

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      ),
    };
  }
  
  return { session, error: null };
}

export async function requireAthlete() {
  const { session, error } = await requireAuth();
  
  if (error) return { session: null, error };
  
  if (session!.user.activeRole !== 'ATHLETE') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Athleten-Berechtigung erforderlich' },
        { status: 403 }
      ),
    };
  }
  
  return { session, error: null };
}

export async function requireTrainer() {
  const { session, error } = await requireAuth();
  
  if (error) return { session: null, error };
  
  const role = session!.user.activeRole;
  if (role !== 'TRAINER' && role !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Trainer-Berechtigung erforderlich' },
        { status: 403 }
      ),
    };
  }
  
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireAuth();
  
  if (error) return { session: null, error };
  
  if (session!.user.activeRole !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Administrator-Berechtigung erforderlich' },
        { status: 403 }
      ),
    };
  }
  
  return { session, error: null };
}
```

### Usage in API Routes

```typescript
// src/app/api/athlete/dashboard/route.ts
import { NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';

export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  // session is guaranteed to be valid and user is an athlete
  const athleteProfileId = session!.user.athleteProfileId;
  
  // ... fetch dashboard data
  
  return NextResponse.json({ data: dashboardData });
}
```

## Route Protection

### Middleware

```typescript
// src/middleware.ts
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
```

## Registration

### Registration API

```typescript
// src/app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registrationSchema } from '@/lib/validation/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = registrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user with athlete profile
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender,
        isAthlete: true,
        athleteProfile: {
          create: {
            guardianName: data.guardianName,
            guardianEmail: data.guardianEmail,
            guardianPhone: data.guardianPhone,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            isApproved: false, // Requires trainer approval
          },
        },
      },
      include: {
        athleteProfile: true,
      },
    });

    // Notify admins
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });

    if (settings?.adminNotificationEmail) {
      await sendEmail(
        settings.adminNotificationEmail,
        'Neue Registrierung',
        `
          <h2>Neue Athleten-Registrierung</h2>
          <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>E-Mail:</strong> ${user.email}</p>
          <p>Bitte melden Sie sich an, um die Registrierung zu prüfen und zu genehmigen.</p>
        `
      );
    }

    return NextResponse.json({
      message: 'Registrierung erfolgreich. Ein Trainer wird Ihr Konto prüfen.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
```

### Validation Schema

```typescript
// src/lib/validation/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort erforderlich'),
});

export const registrationSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Vorname erforderlich'),
  lastName: z.string().min(1, 'Nachname erforderlich'),
  phone: z.string().min(1, 'Telefonnummer erforderlich'),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmNewPassword'],
});
```

## Login Page

```typescript
// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Redirect based on role will happen after session update
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
          <CardDescription>
            SV Esting Trainingsmanager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anmelden
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Noch kein Konto?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Registrieren
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Session Provider Setup

```typescript
// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

```typescript
// src/app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Testing Authentication

### Manual Test Cases

1. **Registration**
   - [ ] Can register with valid data
   - [ ] Cannot register with existing email
   - [ ] Validation errors display correctly
   - [ ] Admin receives notification email

2. **Login**
   - [ ] Can log in with valid credentials
   - [ ] Error shown for invalid credentials
   - [ ] Unapproved athletes cannot log in (if only athlete role)

3. **Role Switching**
   - [ ] Role switcher shows for dual-role users
   - [ ] Role switcher hidden for single-role users
   - [ ] Switching role updates session
   - [ ] Redirect to correct dashboard after switch

4. **Route Protection**
   - [ ] Unauthenticated users redirected to login
   - [ ] Athletes cannot access `/trainer/*`
   - [ ] Trainers cannot access `/trainer/admin/*`
   - [ ] Unauthorized access shows error page