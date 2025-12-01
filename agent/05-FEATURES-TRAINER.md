# Trainer Features

## Overview

Trainers manage training sessions, mark attendance, approve athletes, and view statistics. The trainer interface is shared with administrators, with admin-specific features gated by role.

## Navigation Structure

```
/trainer
├── /dashboard       → Main dashboard with overview
├── /sessions        → Training session management
│   └── /[id]       → Session detail view
├── /athletes        → Athlete management
│   └── /[id]       → Athlete detail view
├── /statistics      → Attendance statistics
├── /files           → File management
├── /profile         → Trainer profile
└── /admin           → Admin-only features (see 06-FEATURES-ADMIN.md)
```

## Trainer Layout

```typescript
// src/app/trainer/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainerNavigation } from '@/components/trainer/navigation';

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.activeRole;
  if (role !== 'TRAINER' && role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <TrainerNavigation user={session.user} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
```

---

## Dashboard

**Route**: `/trainer/dashboard`

### Display Elements

| Element                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| Upcoming Sessions          | Sessions this week where trainer is assigned  |
| Pending Approvals          | Athletes awaiting approval (with badge count) |
| Athletes Needing Attention | Those with recent absence alerts              |
| Weekly Stats               | Sessions conducted, attendance marked         |
| Quick Actions              | Common task buttons                           |

### API Endpoint

```typescript
// src/app/api/trainer/dashboard/route.ts
import { NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Upcoming sessions this week
  const upcomingSessions = await prisma.trainingSession.findMany({
    where: {
      date: { gte: now, lte: weekEnd },
      isCancelled: false,
      sessionGroups: {
        some: {
          trainerAssignments: {
            some: { trainerId },
          },
        },
      },
    },
    include: {
      recurringTraining: true,
      sessionGroups: {
        include: {
          trainerAssignments: true,
          trainingGroup: true,
        },
      },
    },
    orderBy: { date: 'asc' },
    take: 10,
  });

  // Pending approvals
  const pendingApprovals = await prisma.athleteProfile.count({
    where: { isApproved: false },
  });

  // Athletes with recent absence alerts
  const recentAlerts = await prisma.absenceAlert.findMany({
    where: {
      sentAt: { gte: weekStart },
    },
    include: {
      athlete: {
        include: { user: true },
      },
    },
    distinct: ['athleteId'],
  });

  // Weekly stats
  const sessionsThisWeek = await prisma.trainingSession.count({
    where: {
      date: { gte: weekStart, lte: weekEnd },
      isCompleted: true,
    },
  });

  const attendanceMarkedThisWeek = await prisma.attendanceRecord.count({
    where: {
      markedAt: { gte: weekStart, lte: weekEnd },
      markedBy: trainerId,
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
        groups: s.sessionGroups.map((sg) => sg.trainingGroup.name),
      })),
      pendingApprovals,
      athletesNeedingAttention: recentAlerts.map((a) => ({
        id: a.athlete.id,
        name: `${a.athlete.user.firstName} ${a.athlete.user.lastName}`,
        absenceCount: a.absenceCount,
        alertDate: a.sentAt,
      })),
      stats: {
        sessionsThisWeek,
        attendanceMarkedThisWeek,
      },
    },
  });
}
```

---

## Session Management

**Route**: `/trainer/sessions`

### Features

- Calendar/list view of sessions
- Filter by date range, training type
- Quick view of session status
- Links to session details

### Session List Component

```typescript
// src/app/trainer/sessions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Loading } from '@/components/ui/loading';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Session {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  isCompleted: boolean;
  isCancelled: boolean;
  athleteCount: number;
  attendanceMarked: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchSessions();
  }, [selectedDate]);

  const fetchSessions = async () => {
    const params = new URLSearchParams();
    if (selectedDate) {
      params.set('date', selectedDate.toISOString().split('T')[0]);
    }
    
    const response = await fetch(`/api/trainer/sessions?${params}`);
    const data = await response.json();
    setSessions(data.data);
    setIsLoading(false);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trainingseinheiten</h1>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Calendar sidebar */}
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          </CardContent>
        </Card>

        {/* Sessions list */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? formatDate(selectedDate, 'EEEE, dd. MMMM yyyy') : 'Alle Einheiten'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground">Keine Einheiten an diesem Tag</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/trainer/sessions/${session.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.startTime} - {session.endTime} • {session.athleteCount} Athleten
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isCancelled ? (
                          <Badge variant="destructive">Abgesagt</Badge>
                        ) : session.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : session.attendanceMarked ? (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Session Detail View

**Route**: `/trainer/sessions/[id]`

### Tabs

| Tab       | Content                             |
| --------- | ----------------------------------- |
| Übersicht | Session info, status, actions       |
| Übungen   | Exercise editor per group           |
| Athleten  | Athlete list with attendance status |

### Features

- View session information
- Mark attendance
- Edit exercises per group
- Copy exercises from previous week
- Cancel session
- Reassign athletes between groups

### API Endpoint

```typescript
// src/app/api/trainer/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: params.id },
    include: {
      recurringTraining: true,
      sessionGroups: {
        include: {
          trainingGroup: {
            include: {
              athleteAssignments: {
                include: {
                  athlete: {
                    include: { user: true },
                  },
                },
              },
              trainerAssignments: {
                include: {
                  trainer: {
                    include: { user: true },
                  },
                },
              },
            },
          },
          trainerAssignments: {
            include: {
              trainer: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: {
          trainingGroup: { sortOrder: 'asc' },
        },
      },
      cancellations: {
        where: { isActive: true },
        include: {
          athlete: {
            include: { user: true },
          },
        },
      },
      attendanceRecords: true,
      sessionAthleteAssignments: {
        include: {
          athlete: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!trainingSession) {
    return NextResponse.json(
      { error: 'Trainingseinheit nicht gefunden' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: trainingSession });
}
```

---

## Attendance Marking

### Interface

The attendance dialog shows all athletes assigned to the session, organized by group:

```typescript
// src/components/trainer/attendance-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  hasCancelled: boolean;
  cancellationReason?: string;
  currentStatus?: 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';
  notes?: string;
}

interface AttendanceDialogProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athletes: Athlete[];
  onComplete: () => void;
}

export function AttendanceDialog({
  sessionId,
  open,
  onOpenChange,
  athletes,
  onComplete,
}: AttendanceDialogProps) {
  const [attendance, setAttendance] = useState<{
    [athleteId: string]: {
      status: 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';
      notes: string;
    };
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Initialize with current status or defaults
    const initial: typeof attendance = {};
    athletes.forEach((athlete) => {
      initial[athlete.id] = {
        status: athlete.currentStatus || 
          (athlete.hasCancelled ? 'ABSENT_EXCUSED' : 'PRESENT'),
        notes: athlete.notes || '',
      };
    });
    setAttendance(initial);
  }, [athletes]);

  const handleStatusChange = (
    athleteId: string,
    status: 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED'
  ) => {
    setAttendance((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], status },
    }));
  };

  const handleNotesChange = (athleteId: string, notes: string) => {
    setAttendance((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], notes },
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const records = Object.entries(attendance).map(([athleteId, data]) => ({
        athleteId,
        status: data.status,
        notes: data.notes || undefined,
      }));

      const response = await fetch(`/api/trainer/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      toast.success('Anwesenheit gespeichert');
      onOpenChange(false);
      onComplete();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anwesenheit erfassen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {athletes.map((athlete) => (
            <div
              key={athlete.id}
              className="flex flex-col gap-2 p-4 border rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {athlete.firstName} {athlete.lastName}
                  </p>
                  {athlete.hasCancelled && (
                    <Badge variant="secondary" className="mt-1">
                      Abgesagt: {athlete.cancellationReason}
                    </Badge>
                  )}
                </div>
                <Select
                  value={attendance[athlete.id]?.status || 'PRESENT'}
                  onValueChange={(value) =>
                    handleStatusChange(
                      athlete.id,
                      value as 'PRESENT' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED'
                    )
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">
                      {ATTENDANCE_STATUS_LABELS.PRESENT}
                    </SelectItem>
                    <SelectItem value="ABSENT_EXCUSED">
                      {ATTENDANCE_STATUS_LABELS.ABSENT_EXCUSED}
                    </SelectItem>
                    <SelectItem value="ABSENT_UNEXCUSED">
                      {ATTENDANCE_STATUS_LABELS.ABSENT_UNEXCUSED}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Notizen (optional)"
                value={attendance[athlete.id]?.notes || ''}
                onChange={(e) => handleNotesChange(athlete.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Attendance API

```typescript
// src/app/api/trainer/sessions/[id]/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkAbsenceAlert } from '@/lib/services/absenceAlertService';

const attendanceSchema = z.object({
  records: z.array(
    z.object({
      athleteId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED']),
      notes: z.string().optional(),
    })
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const body = await request.json();

  const validation = attendanceSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { records } = validation.data;

  // Verify session exists
  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: params.id },
  });

  if (!trainingSession) {
    return NextResponse.json(
      { error: 'Trainingseinheit nicht gefunden' },
      { status: 404 }
    );
  }

  // Upsert all attendance records
  const results = await Promise.all(
    records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          athleteId_trainingSessionId: {
            athleteId: record.athleteId,
            trainingSessionId: params.id,
          },
        },
        update: {
          status: record.status,
          notes: record.notes,
          lastModifiedBy: trainerId,
          lastModifiedAt: new Date(),
        },
        create: {
          athleteId: record.athleteId,
          trainingSessionId: params.id,
          status: record.status,
          notes: record.notes,
          markedBy: trainerId,
        },
      })
    )
  );

  // Mark session as completed
  await prisma.trainingSession.update({
    where: { id: params.id },
    data: { isCompleted: true },
  });

  // Check for absence alerts for athletes marked unexcused
  const unexcusedAthletes = records.filter(
    (r) => r.status === 'ABSENT_UNEXCUSED'
  );
  
  for (const record of unexcusedAthletes) {
    await checkAbsenceAlert(record.athleteId);
  }

  return NextResponse.json({
    data: results,
    message: 'Anwesenheit erfolgreich gespeichert',
  });
}
```

---

## Athlete Management

**Route**: `/trainer/athletes`

### Features

- View all athletes (approved and pending)
- Filter by approval status, youth category
- Search by name or email
- View athlete details
- Approve pending registrations

### Athlete List

```typescript
// src/app/api/trainer/athletes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status'); // 'approved', 'pending', 'all'
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  const where: any = {};

  if (status === 'approved') {
    where.isApproved = true;
  } else if (status === 'pending') {
    where.isApproved = false;
  }

  if (category) {
    where.youthCategory = category;
  }

  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const athletes = await prisma.athleteProfile.findMany({
    where,
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
    orderBy: [
      { isApproved: 'asc' }, // Pending first
      { user: { lastName: 'asc' } },
    ],
  });

  return NextResponse.json({
    data: athletes.map((a) => ({
      id: a.id,
      email: a.user.email,
      firstName: a.user.firstName,
      lastName: a.user.lastName,
      phone: a.user.phone,
      youthCategory: a.youthCategory,
      isApproved: a.isApproved,
      approvedAt: a.approvedAt,
      competitionParticipation: a.competitionParticipation,
      hasDtbId: a.hasDtbId,
      trainingGroups: a.recurringTrainingAssignments.map((ta) => ({
        id: ta.trainingGroup.id,
        name: ta.trainingGroup.name,
        trainingName: ta.trainingGroup.recurringTraining.name,
      })),
    })),
  });
}
```

---

## Athlete Approval

### Approval Flow

1. Trainer views pending athlete
2. Reviews registration information
3. Configures:
   - Youth category
   - Competition participation flag
   - DTB ID status
   - Training group assignments
4. Approves athlete
5. System sends approval email

### API Endpoint

```typescript
// src/app/api/trainer/athletes/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const approvalSchema = z.object({
  youthCategory: z.enum(['F', 'E', 'D']),
  competitionParticipation: z.boolean(),
  hasDtbId: z.boolean(),
  trainingGroupIds: z.array(z.string()).min(1, 'Mindestens eine Trainingsgruppe erforderlich'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const body = await request.json();

  const validation = approvalSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const config = validation.data;

  // Verify athlete exists and is pending
  const athlete = await prisma.athleteProfile.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!athlete) {
    return NextResponse.json(
      { error: 'Athlet nicht gefunden' },
      { status: 404 }
    );
  }

  if (athlete.isApproved) {
    return NextResponse.json(
      { error: 'Athlet ist bereits genehmigt' },
      { status: 400 }
    );
  }

  // Transaction: Update athlete and create group assignments
  const updated = await prisma.$transaction(async (tx) => {
    // Update athlete profile
    const updatedAthlete = await tx.athleteProfile.update({
      where: { id: params.id },
      data: {
        isApproved: true,
        approvedBy: trainerId,
        approvedAt: new Date(),
        configuredAt: new Date(),
        youthCategory: config.youthCategory,
        competitionParticipation: config.competitionParticipation,
        hasDtbId: config.hasDtbId,
      },
      include: { user: true },
    });

    // Create training group assignments
    await Promise.all(
      config.trainingGroupIds.map((groupId) =>
        tx.recurringTrainingAthleteAssignment.create({
          data: {
            trainingGroupId: groupId,
            athleteId: params.id,
            assignedBy: trainerId,
          },
        })
      )
    );

    // Create audit log
    await tx.auditLog.create({
      data: {
        entityType: 'athlete',
        entityId: params.id,
        action: 'approve',
        performedBy: trainerId,
        changes: {
          approved: true,
          ...config,
        },
      },
    });

    return updatedAthlete;
  });

  // Send approval email
  await sendEmail(
    updated.user.email,
    'Registrierung genehmigt - SV Esting',
    `
      <h2>Willkommen bei SV Esting!</h2>
      <p>Hallo ${updated.user.firstName},</p>
      <p>Deine Registrierung wurde genehmigt. Du kannst dich jetzt anmelden und deinen Trainingsplan einsehen.</p>
      <p>Viele Grüße,<br>SV Esting Turnen</p>
    `
  );

  return NextResponse.json({
    data: updated,
    message: 'Athlet erfolgreich genehmigt',
  });
}
```

---

## Statistics

**Route**: `/trainer/statistics`

### Features

- Attendance statistics by date range
- Charts showing attendance rates
- Per-athlete breakdown
- Per-training breakdown
- Export options

### API Endpoint

```typescript
// src/app/api/trainer/statistics/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to && { lte: new Date(to) }),
  };

  // Overall statistics
  const records = await prisma.attendanceRecord.findMany({
    where: {
      trainingSession: {
        date: dateFilter,
      },
    },
    include: {
      athlete: { include: { user: true } },
      trainingSession: { include: { recurringTraining: true } },
    },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const excused = records.filter((r) => r.status === 'ABSENT_EXCUSED').length;
  const unexcused = records.filter((r) => r.status === 'ABSENT_UNEXCUSED').length;

  // Per-athlete breakdown
  const byAthlete = records.reduce((acc, record) => {
    const athleteId = record.athleteId;
    if (!acc[athleteId]) {
      acc[athleteId] = {
        id: athleteId,
        name: `${record.athlete.user.firstName} ${record.athlete.user.lastName}`,
        total: 0,
        present: 0,
        excused: 0,
        unexcused: 0,
      };
    }
    acc[athleteId].total++;
    if (record.status === 'PRESENT') acc[athleteId].present++;
    else if (record.status === 'ABSENT_EXCUSED') acc[athleteId].excused++;
    else acc[athleteId].unexcused++;
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json({
    data: {
      overall: {
        total,
        present,
        excused,
        unexcused,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
      },
      byAthlete: Object.values(byAthlete).map((a: any) => ({
        ...a,
        attendanceRate: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
      })),
    },
  });
}
```

---

## File Management

**Route**: `/trainer/files`

### Features

- View all uploaded files
- Upload new files (PDF only)
- Edit file metadata
- Delete files
- Organize by category

### File Upload API

```typescript
// src/app/api/trainer/files/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const categoryId = formData.get('categoryId') as string;
  const targetDate = formData.get('targetDate') as string | null;

  if (!file || !title || !categoryId) {
    return NextResponse.json(
      { error: 'Datei, Titel und Kategorie erforderlich' },
      { status: 400 }
    );
  }

  // Check file type
  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Nur PDF-Dateien erlaubt' },
      { status: 400 }
    );
  }

  // Check file size
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });
  const maxSize = (settings?.maxUploadSizeMB || 10) * 1024 * 1024;

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Datei zu groß. Maximum: ${settings?.maxUploadSizeMB || 10}MB` },
      { status: 400 }
    );
  }

  // Save file
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${uuid()}.pdf`;
  const filePath = join(uploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Create database record
  const upload = await prisma.upload.create({
    data: {
      categoryId,
      title,
      targetDate,
      filePath: fileName,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: trainerId,
    },
    include: { category: true },
  });

  return NextResponse.json({
    data: upload,
    message: 'Datei erfolgreich hochgeladen',
  });
}
```

---

## Session Cancellation (by Trainer)

Trainers can cancel entire sessions:

```typescript
// src/app/api/trainer/sessions/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireTrainer } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { formatDate } from '@/lib/utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const { reason } = await request.json();

  if (!reason || reason.length < 10) {
    return NextResponse.json(
      { error: 'Grund muss mindestens 10 Zeichen haben' },
      { status: 400 }
    );
  }

  // Get session with athletes
  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: params.id },
    include: {
      recurringTraining: {
        include: {
          trainingGroups: {
            include: {
              athleteAssignments: {
                include: {
                  athlete: { include: { user: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!trainingSession) {
    return NextResponse.json(
      { error: 'Trainingseinheit nicht gefunden' },
      { status: 404 }
    );
  }

  // Cancel session
  const updated = await prisma.trainingSession.update({
    where: { id: params.id },
    data: {
      isCancelled: true,
      cancelledBy: trainerId,
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  });

  // Notify all assigned athletes
  const athletes = trainingSession.recurringTraining?.trainingGroups
    .flatMap((g) => g.athleteAssignments)
    .map((a) => a.athlete) || [];

  const uniqueAthletes = Array.from(
    new Map(athletes.map((a) => [a.id, a])).values()
  );

  for (const athlete of uniqueAthletes) {
    await sendEmail(
      athlete.user.email,
      'Training abgesagt - SV Esting',
      `
        <h2>Training abgesagt</h2>
        <p>Hallo ${athlete.user.firstName},</p>
        <p>Das Training am ${formatDate(trainingSession.date)} wurde abgesagt.</p>
        <p><strong>Grund:</strong> ${reason}</p>
        <p>Viele Grüße,<br>SV Esting Turnen</p>
      `
    );
  }

  return NextResponse.json({
    data: updated,
    message: 'Training erfolgreich abgesagt',
  });
}
```

---

## Testing Checklist

### Dashboard
- [ ] Shows upcoming sessions correctly
- [ ] Pending approvals count accurate
- [ ] Athletes needing attention displayed
- [ ] Weekly stats calculated correctly

### Sessions
- [ ] Calendar navigation works
- [ ] Session list filters correctly
- [ ] Session detail loads all data
- [ ] Exercises can be edited
- [ ] Exercises copy from previous week

### Attendance
- [ ] Dialog shows all athletes
- [ ] Cancelled athletes pre-marked
- [ ] All statuses can be selected
- [ ] Notes can be added
- [ ] Save marks session complete

### Athletes
- [ ] List filters work (status, category, search)
- [ ] Pending athletes shown first
- [ ] Approval flow works end-to-end
- [ ] Email sent on approval

### Files
- [ ] Upload works for PDF
- [ ] Upload rejects non-PDF
- [ ] Upload respects size limit
- [ ] Download works
- [ ] Delete removes file

### Session Cancellation
- [ ] Reason validation works
- [ ] Session marked cancelled
- [ ] Athletes notified by email