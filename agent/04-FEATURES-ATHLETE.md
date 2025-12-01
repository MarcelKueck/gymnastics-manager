# Athlete Features

## Overview

Athletes are the primary users of the system. They view their training schedules, cancel sessions when needed, track their attendance, and manage their profiles.

## Navigation Structure

```
/athlete
├── /dashboard       → Main dashboard with overview
├── /schedule        → Training schedule calendar
├── /cancellations   → Manage session cancellations
├── /profile         → Edit personal information
├── /competitions    → View and register for competitions
├── /files           → Access training documents
└── /history         → View attendance history
```

## Athlete Layout

```typescript
// src/app/athlete/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AthleteNavigation } from '@/components/athlete/navigation';

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.activeRole !== 'ATHLETE') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <AthleteNavigation user={session.user} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
```

---

## Dashboard

**Route**: `/athlete/dashboard`

### Display Elements

| Element              | Description                                    |
| -------------------- | ---------------------------------------------- |
| Welcome Message      | Personalized greeting with athlete name        |
| Next Training        | Card showing next upcoming session             |
| Upcoming Sessions    | List of next 5 sessions                        |
| Monthly Stats        | Attendance rate, present count, total sessions |
| Active Cancellations | Count with link to cancellations page          |
| Quick Actions        | Buttons for common tasks                       |

### API Endpoint

```typescript
// src/app/api/athlete/dashboard/route.ts
import { NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get athlete's training group IDs
  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { athleteId },
    select: { trainingGroupId: true },
  });
  const groupIds = assignments.map((a) => a.trainingGroupId);

  // Upcoming sessions
  const upcomingSessions = await prisma.trainingSession.findMany({
    where: {
      date: { gte: now },
      isCancelled: false,
      recurringTraining: {
        trainingGroups: {
          some: { id: { in: groupIds } },
        },
      },
    },
    include: {
      recurringTraining: true,
      cancellations: {
        where: { athleteId, isActive: true },
      },
    },
    orderBy: { date: 'asc' },
    take: 5,
  });

  // Monthly attendance
  const attendanceRecords = await prisma.attendanceRecord.findMany({
    where: {
      athleteId,
      trainingSession: {
        date: { gte: monthStart, lte: monthEnd },
      },
    },
  });

  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(
    (r) => r.status === 'PRESENT'
  ).length;
  const attendanceRate = totalSessions > 0 
    ? Math.round((presentCount / totalSessions) * 100) 
    : 0;

  // Active cancellations count
  const activeCancellations = await prisma.cancellation.count({
    where: {
      athleteId,
      isActive: true,
      trainingSession: { date: { gte: now } },
    },
  });

  return NextResponse.json({
    data: {
      upcomingSessions: upcomingSessions.map((s) => ({
        id: s.id,
        date: s.date,
        name: s.recurringTraining?.name || 'Training',
        startTime: s.startTime || s.recurringTraining?.startTime,
        endTime: s.endTime || s.recurringTraining?.endTime,
        isCancelled: s.cancellations.length > 0,
      })),
      monthlyStats: {
        totalSessions,
        presentCount,
        attendanceRate,
      },
      activeCancellations,
    },
  });
}
```

### Dashboard Component

```typescript
// src/app/athlete/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Calendar, Clock, Percent, Ban } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

interface DashboardData {
  upcomingSessions: {
    id: string;
    date: string;
    name: string;
    startTime: string;
    endTime: string;
    isCancelled: boolean;
  }[];
  monthlyStats: {
    totalSessions: number;
    presentCount: number;
    attendanceRate: number;
  };
  activeCancellations: number;
}

export default function AthleteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/athlete/dashboard')
      .then((res) => res.json())
      .then((result) => setData(result.data))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (!data) return <div>Fehler beim Laden</div>;

  const nextSession = data.upcomingSessions[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Anwesenheitsrate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.monthlyStats.attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.monthlyStats.presentCount} von {data.monthlyStats.totalSessions} diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Nächstes Training
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextSession ? (
              <>
                <div className="text-2xl font-bold">
                  {formatDate(nextSession.date)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextSession.name}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">
                Keine anstehenden Trainings
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Aktive Absagen
            </CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeCancellations}
            </div>
            <Link href="/athlete/cancellations">
              <Button variant="link" className="p-0 h-auto text-xs">
                Verwalten →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Anstehende Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground">
              Keine anstehenden Trainings
            </p>
          ) : (
            <div className="space-y-4">
              {data.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(session.date)} • {session.startTime} - {session.endTime}
                    </p>
                  </div>
                  {session.isCancelled && (
                    <Badge variant="secondary">Abgesagt</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Training Schedule

**Route**: `/athlete/schedule`

### Features

- Calendar/list view of assigned trainings
- Filter by date range or training type
- Visual indicators for session status
- Quick cancel button for upcoming sessions

### Session Status Visual Indicators

| Status               | Visual                |
| -------------------- | --------------------- |
| Upcoming             | Default card style    |
| Cancelled by athlete | Yellow/warning badge  |
| Session cancelled    | Red/destructive badge |
| Completed - Present  | Green checkmark       |
| Completed - Absent   | Red/grey indicator    |

### API Endpoint

```typescript
// src/app/api/athlete/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const searchParams = request.nextUrl.searchParams;
  const weeksAhead = parseInt(searchParams.get('weeks') || '4');

  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = addDays(startDate, weeksAhead * 7);

  // Get athlete's assigned training groups
  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { athleteId },
    include: {
      trainingGroup: {
        include: { recurringTraining: true },
      },
    },
  });

  const groupIds = assignments.map((a) => a.trainingGroupId);

  // Get sessions
  const sessions = await prisma.trainingSession.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      recurringTraining: {
        trainingGroups: {
          some: { id: { in: groupIds } },
        },
      },
    },
    include: {
      recurringTraining: true,
      cancellations: {
        where: { athleteId, isActive: true },
      },
      attendanceRecords: {
        where: { athleteId },
      },
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({
    data: sessions.map((s) => ({
      id: s.id,
      date: s.date,
      name: s.recurringTraining?.name || 'Training',
      startTime: s.startTime || s.recurringTraining?.startTime,
      endTime: s.endTime || s.recurringTraining?.endTime,
      isCancelled: s.isCancelled,
      cancellationReason: s.cancellationReason,
      athleteCancelled: s.cancellations.length > 0,
      athleteCancellationReason: s.cancellations[0]?.reason,
      isCompleted: s.isCompleted,
      attendanceStatus: s.attendanceRecords[0]?.status,
    })),
  });
}
```

---

## Cancellation System

**Route**: `/athlete/cancellations`

### Business Rules

| Rule                  | Value                                          |
| --------------------- | ---------------------------------------------- |
| Minimum reason length | 10 characters                                  |
| Deadline              | Configurable (default: 2 hours before session) |
| Edit/Undo             | Only before deadline                           |

### Single Cancellation API

```typescript
// src/app/api/athlete/cancellations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { subHours } from 'date-fns';

const cancellationSchema = z.object({
  trainingSessionId: z.string(),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen haben'),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const body = await request.json();

  const validation = cancellationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { trainingSessionId, reason } = validation.data;

  // Get session and settings
  const [trainingSession, settings] = await Promise.all([
    prisma.trainingSession.findUnique({
      where: { id: trainingSessionId },
      include: { recurringTraining: true },
    }),
    prisma.systemSettings.findUnique({ where: { id: 'default' } }),
  ]);

  if (!trainingSession) {
    return NextResponse.json(
      { error: 'Training nicht gefunden' },
      { status: 404 }
    );
  }

  // Check deadline
  const deadlineHours = settings?.cancellationDeadlineHours || 2;
  const sessionStart = new Date(trainingSession.date);
  const [hours, minutes] = (
    trainingSession.startTime || trainingSession.recurringTraining?.startTime || '00:00'
  ).split(':').map(Number);
  sessionStart.setHours(hours, minutes);

  const deadline = subHours(sessionStart, deadlineHours);

  if (new Date() > deadline) {
    return NextResponse.json(
      { error: 'Absagefrist überschritten' },
      { status: 400 }
    );
  }

  // Check if already cancelled
  const existing = await prisma.cancellation.findUnique({
    where: {
      athleteId_trainingSessionId: {
        athleteId,
        trainingSessionId,
      },
    },
  });

  if (existing && existing.isActive) {
    return NextResponse.json(
      { error: 'Training bereits abgesagt' },
      { status: 400 }
    );
  }

  // Create or reactivate cancellation
  const cancellation = await prisma.cancellation.upsert({
    where: {
      athleteId_trainingSessionId: {
        athleteId,
        trainingSessionId,
      },
    },
    update: {
      reason,
      isActive: true,
      cancelledAt: new Date(),
      undoneAt: null,
    },
    create: {
      athleteId,
      trainingSessionId,
      reason,
    },
  });

  return NextResponse.json({
    data: cancellation,
    message: 'Training erfolgreich abgesagt',
  });
}

// GET active cancellations
export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;

  const cancellations = await prisma.cancellation.findMany({
    where: {
      athleteId,
      isActive: true,
      trainingSession: {
        date: { gte: new Date() },
      },
    },
    include: {
      trainingSession: {
        include: { recurringTraining: true },
      },
    },
    orderBy: {
      trainingSession: { date: 'asc' },
    },
  });

  return NextResponse.json({ data: cancellations });
}
```

### Undo Cancellation

```typescript
// src/app/api/athlete/cancellations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { subHours } from 'date-fns';

// PUT - Update cancellation reason
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const { reason } = await request.json();

  if (!reason || reason.length < 10) {
    return NextResponse.json(
      { error: 'Grund muss mindestens 10 Zeichen haben' },
      { status: 400 }
    );
  }

  const cancellation = await prisma.cancellation.findFirst({
    where: { id: params.id, athleteId, isActive: true },
    include: {
      trainingSession: { include: { recurringTraining: true } },
    },
  });

  if (!cancellation) {
    return NextResponse.json(
      { error: 'Absage nicht gefunden' },
      { status: 404 }
    );
  }

  // Check deadline
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });
  const deadlineHours = settings?.cancellationDeadlineHours || 2;
  const sessionStart = new Date(cancellation.trainingSession.date);
  const [hours, minutes] = (
    cancellation.trainingSession.startTime ||
    cancellation.trainingSession.recurringTraining?.startTime ||
    '00:00'
  ).split(':').map(Number);
  sessionStart.setHours(hours, minutes);

  if (new Date() > subHours(sessionStart, deadlineHours)) {
    return NextResponse.json(
      { error: 'Absagefrist überschritten' },
      { status: 400 }
    );
  }

  const updated = await prisma.cancellation.update({
    where: { id: params.id },
    data: { reason },
  });

  return NextResponse.json({ data: updated });
}

// DELETE - Undo cancellation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;

  const cancellation = await prisma.cancellation.findFirst({
    where: { id: params.id, athleteId, isActive: true },
    include: {
      trainingSession: { include: { recurringTraining: true } },
    },
  });

  if (!cancellation) {
    return NextResponse.json(
      { error: 'Absage nicht gefunden' },
      { status: 404 }
    );
  }

  // Check deadline (same logic)
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });
  const deadlineHours = settings?.cancellationDeadlineHours || 2;
  const sessionStart = new Date(cancellation.trainingSession.date);
  const [hours, minutes] = (
    cancellation.trainingSession.startTime ||
    cancellation.trainingSession.recurringTraining?.startTime ||
    '00:00'
  ).split(':').map(Number);
  sessionStart.setHours(hours, minutes);

  if (new Date() > subHours(sessionStart, deadlineHours)) {
    return NextResponse.json(
      { error: 'Absagefrist überschritten' },
      { status: 400 }
    );
  }

  const updated = await prisma.cancellation.update({
    where: { id: params.id },
    data: {
      isActive: false,
      undoneAt: new Date(),
    },
  });

  return NextResponse.json({
    data: updated,
    message: 'Absage zurückgenommen',
  });
}
```

### Bulk Cancellation

```typescript
// src/app/api/athlete/cancellations/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bulkCancellationSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(10),
  recurringTrainingIds: z.array(z.string()).optional(), // Filter to specific trainings
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const body = await request.json();

  const validation = bulkCancellationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { startDate, endDate, reason, recurringTrainingIds } = validation.data;

  // Get athlete's assigned groups
  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { athleteId },
    select: { trainingGroupId: true, trainingGroup: { select: { recurringTrainingId: true } } },
  });

  let validTrainingIds = assignments.map((a) => a.trainingGroup.recurringTrainingId);
  
  if (recurringTrainingIds?.length) {
    validTrainingIds = validTrainingIds.filter((id) =>
      recurringTrainingIds.includes(id)
    );
  }

  // Get sessions in date range
  const sessions = await prisma.trainingSession.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      recurringTrainingId: { in: validTrainingIds },
      isCancelled: false,
    },
  });

  // Get deadline settings
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });
  const deadlineHours = settings?.cancellationDeadlineHours || 2;

  // Filter sessions within deadline
  const now = new Date();
  const eligibleSessions = sessions.filter((s) => {
    const sessionTime = new Date(s.date);
    sessionTime.setHours(sessionTime.getHours() - deadlineHours);
    return now < sessionTime;
  });

  // Create cancellations
  const results = await Promise.allSettled(
    eligibleSessions.map((session) =>
      prisma.cancellation.upsert({
        where: {
          athleteId_trainingSessionId: {
            athleteId,
            trainingSessionId: session.id,
          },
        },
        update: {
          reason,
          isActive: true,
          cancelledAt: new Date(),
          undoneAt: null,
        },
        create: {
          athleteId,
          trainingSessionId: session.id,
          reason,
        },
      })
    )
  );

  const created = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({
    message: `${created} Trainings abgesagt${failed > 0 ? `, ${failed} fehlgeschlagen` : ''}`,
    data: { created, failed, total: eligibleSessions.length },
  });
}
```

---

## Athlete Profile

**Route**: `/athlete/profile`

### Editable Fields

- First name
- Last name
- Phone number
- Guardian information (name, email, phone)
- Emergency contact (name, phone)
- Password (requires current password)

### Read-Only Fields

- Email (login identifier)
- Youth category
- Competition participation flag
- DTB ID status
- Training group assignments

### API Endpoint

```typescript
// src/app/api/athlete/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athlete = await prisma.athleteProfile.findUnique({
    where: { id: session!.user.athleteProfileId },
    include: {
      user: true,
      recurringTrainingAssignments: {
        include: {
          trainingGroup: {
            include: { recurringTraining: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    data: {
      email: athlete?.user.email,
      firstName: athlete?.user.firstName,
      lastName: athlete?.user.lastName,
      phone: athlete?.user.phone,
      birthDate: athlete?.user.birthDate,
      gender: athlete?.user.gender,
      guardianName: athlete?.guardianName,
      guardianEmail: athlete?.guardianEmail,
      guardianPhone: athlete?.guardianPhone,
      emergencyContactName: athlete?.emergencyContactName,
      emergencyContactPhone: athlete?.emergencyContactPhone,
      youthCategory: athlete?.youthCategory,
      competitionParticipation: athlete?.competitionParticipation,
      hasDtbId: athlete?.hasDtbId,
      trainingGroups: athlete?.recurringTrainingAssignments.map((a) => ({
        id: a.trainingGroup.id,
        name: a.trainingGroup.name,
        trainingName: a.trainingGroup.recurringTraining.name,
      })),
    },
  });
}

export async function PUT(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const body = await request.json();

  // Update user data
  await prisma.user.update({
    where: { id: session!.user.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    },
  });

  // Update athlete profile
  const updated = await prisma.athleteProfile.update({
    where: { id: athleteId },
    data: {
      guardianName: body.guardianName,
      guardianEmail: body.guardianEmail,
      guardianPhone: body.guardianPhone,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
    },
    include: { user: true },
  });

  return NextResponse.json({ data: updated });
}
```

---

## Competitions

**Route**: `/athlete/competitions`

### Features

- View published competitions
- Check eligibility based on:
  - Youth category range
  - DTB ID requirement
  - Registration deadline
  - Capacity limits
- Register/unregister for competitions
- View past results (placement, score)

### API Endpoints

See [07-API-REFERENCE.md](./07-API-REFERENCE.md) for complete competition API documentation.

---

## Files/Documents

**Route**: `/athlete/files`

### Features

- View uploaded training plans
- Download files
- Organized by categories
- Target date display for weekly plans

---

## Attendance History

**Route**: `/athlete/history`

### Features

- View all past attendance records
- Filter by date range
- Statistics summary
- Export options (future enhancement)

### API Endpoint

```typescript
// src/app/api/athlete/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const records = await prisma.attendanceRecord.findMany({
    where: {
      athleteId,
      ...(from && { trainingSession: { date: { gte: new Date(from) } } }),
      ...(to && { trainingSession: { date: { lte: new Date(to) } } }),
    },
    include: {
      trainingSession: {
        include: { recurringTraining: true },
      },
    },
    orderBy: {
      trainingSession: { date: 'desc' },
    },
  });

  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === 'PRESENT').length,
    excused: records.filter((r) => r.status === 'ABSENT_EXCUSED').length,
    unexcused: records.filter((r) => r.status === 'ABSENT_UNEXCUSED').length,
  };

  return NextResponse.json({
    data: {
      records: records.map((r) => ({
        id: r.id,
        date: r.trainingSession.date,
        trainingName: r.trainingSession.recurringTraining?.name || 'Training',
        status: r.status,
        notes: r.notes,
      })),
      stats,
    },
  });
}
```

---

## Testing Checklist

### Dashboard
- [ ] Displays correct upcoming sessions
- [ ] Shows accurate monthly statistics
- [ ] Active cancellations count is correct
- [ ] Quick actions navigate correctly

### Schedule
- [ ] Shows only assigned trainings
- [ ] Session status indicators correct
- [ ] Cancel button works within deadline
- [ ] Past sessions show attendance status

### Cancellations
- [ ] Can cancel within deadline
- [ ] Cannot cancel after deadline
- [ ] Reason validation works (min 10 chars)
- [ ] Can edit reason before deadline
- [ ] Can undo before deadline
- [ ] Bulk cancellation works

### Profile
- [ ] Can view all profile data
- [ ] Can edit allowed fields
- [ ] Cannot edit restricted fields
- [ ] Password change requires current password

### Competitions
- [ ] Shows published competitions only
- [ ] Eligibility checks work
- [ ] Can register when eligible
- [ ] Cannot register when ineligible
- [ ] Can unregister before deadline