# Administrator Features

## Overview

Administrators have access to all trainer features plus system configuration capabilities. Admin-specific features are located under `/trainer/admin/*`.

## Navigation Structure

```
/trainer/admin
├── /trainings       → Recurring training management
│   └── /[id]       → Training detail with groups
├── /users           → User management
├── /competitions    → Competition management
│   └── /[id]       → Competition detail with registrations
├── /hours           → Trainer hours management
├── /settings        → System settings
├── /file-categories → File category management
└── /absences        → Absence alert management
```

## Admin Route Protection

```typescript
// src/app/trainer/admin/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.activeRole !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
```

---

## Recurring Trainings Management

**Route**: `/trainer/admin/trainings`

### Features

- Create new recurring trainings
- Edit training details (name, time, recurrence)
- Manage training groups
- Set validity date range
- Delete trainings (with cascade)

### Training List

```typescript
// src/app/api/admin/trainings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const trainingSchema = z.object({
  name: z.string().min(1, 'Name erforderlich'),
  dayOfWeek: z.enum([
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
    'FRIDAY', 'SATURDAY', 'SUNDAY'
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  recurrence: z.enum(['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

// GET - List all recurring trainings
export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainings = await prisma.recurringTraining.findMany({
    include: {
      trainingGroups: {
        include: {
          athleteAssignments: {
            include: {
              athlete: { include: { user: true } },
            },
          },
          trainerAssignments: {
            include: {
              trainer: { include: { user: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      createdByTrainer: {
        include: { user: true },
      },
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return NextResponse.json({ data: trainings });
}

// POST - Create new recurring training
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const body = await request.json();

  const validation = trainingSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Validate time order
  if (data.startTime >= data.endTime) {
    return NextResponse.json(
      { error: 'Endzeit muss nach Startzeit sein' },
      { status: 400 }
    );
  }

  const training = await prisma.recurringTraining.create({
    data: {
      name: data.name,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence,
      validFrom: data.validFrom ? new Date(data.validFrom) : null,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      createdBy: trainerId,
    },
    include: {
      trainingGroups: true,
    },
  });

  return NextResponse.json({
    data: training,
    message: 'Training erfolgreich erstellt',
  });
}
```

### Training Detail & Update

```typescript
// src/app/api/admin/trainings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get training details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const training = await prisma.recurringTraining.findUnique({
    where: { id: params.id },
    include: {
      trainingGroups: {
        include: {
          athleteAssignments: {
            include: {
              athlete: { include: { user: true } },
            },
          },
          trainerAssignments: {
            include: {
              trainer: { include: { user: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!training) {
    return NextResponse.json(
      { error: 'Training nicht gefunden' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: training });
}

// PUT - Update training
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  const training = await prisma.recurringTraining.update({
    where: { id: params.id },
    data: {
      name: body.name,
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      recurrence: body.recurrence,
      isActive: body.isActive,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
    },
  });

  return NextResponse.json({
    data: training,
    message: 'Training erfolgreich aktualisiert',
  });
}

// DELETE - Delete training (cascades to groups, sessions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  await prisma.recurringTraining.delete({
    where: { id: params.id },
  });

  return NextResponse.json({
    message: 'Training erfolgreich gelöscht',
  });
}
```

---

## Training Group Management

### Group CRUD

```typescript
// src/app/api/admin/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const groupSchema = z.object({
  recurringTrainingId: z.string(),
  name: z.string().min(1, 'Name erforderlich'),
  sortOrder: z.number().optional(),
});

// POST - Create new group
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const validation = groupSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Get max sort order
  const maxOrder = await prisma.trainingGroup.aggregate({
    where: { recurringTrainingId: data.recurringTrainingId },
    _max: { sortOrder: true },
  });

  const group = await prisma.trainingGroup.create({
    data: {
      recurringTrainingId: data.recurringTrainingId,
      name: data.name,
      sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
    },
  });

  return NextResponse.json({
    data: group,
    message: 'Gruppe erfolgreich erstellt',
  });
}
```

### Group Athletes Management

```typescript
// src/app/api/admin/groups/[id]/athletes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get athletes in group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
    where: { trainingGroupId: params.id },
    include: {
      athlete: { include: { user: true } },
    },
  });

  return NextResponse.json({
    data: assignments.map((a) => ({
      id: a.athlete.id,
      firstName: a.athlete.user.firstName,
      lastName: a.athlete.user.lastName,
      email: a.athlete.user.email,
      youthCategory: a.athlete.youthCategory,
      assignedAt: a.assignedAt,
    })),
  });
}

// POST - Add athletes to group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const { athleteIds } = await request.json();

  if (!Array.isArray(athleteIds) || athleteIds.length === 0) {
    return NextResponse.json(
      { error: 'Athleten-IDs erforderlich' },
      { status: 400 }
    );
  }

  // Create assignments (skip existing)
  const results = await Promise.allSettled(
    athleteIds.map((athleteId) =>
      prisma.recurringTrainingAthleteAssignment.create({
        data: {
          trainingGroupId: params.id,
          athleteId,
          assignedBy: trainerId,
        },
      })
    )
  );

  const created = results.filter((r) => r.status === 'fulfilled').length;

  return NextResponse.json({
    message: `${created} Athlet(en) hinzugefügt`,
  });
}

// DELETE - Remove athlete from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { athleteId } = await request.json();

  await prisma.recurringTrainingAthleteAssignment.delete({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: params.id,
        athleteId,
      },
    },
  });

  return NextResponse.json({
    message: 'Athlet erfolgreich entfernt',
  });
}
```

### Group Trainers Management

```typescript
// src/app/api/admin/groups/[id]/trainers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// POST - Add trainer to group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const adminId = session!.user.trainerProfileId!;
  const { trainerIds, isPrimary } = await request.json();

  const results = await Promise.allSettled(
    trainerIds.map((trainerId: string) =>
      prisma.recurringTrainingTrainerAssignment.create({
        data: {
          trainingGroupId: params.id,
          trainerId,
          isPrimary: isPrimary || false,
          assignedBy: adminId,
        },
      })
    )
  );

  const created = results.filter((r) => r.status === 'fulfilled').length;

  return NextResponse.json({
    message: `${created} Trainer hinzugefügt`,
  });
}

// DELETE - Remove trainer from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { trainerId } = await request.json();

  await prisma.recurringTrainingTrainerAssignment.delete({
    where: {
      trainingGroupId_trainerId: {
        trainingGroupId: params.id,
        trainerId,
      },
    },
  });

  return NextResponse.json({
    message: 'Trainer erfolgreich entfernt',
  });
}
```

---

## User Management

**Route**: `/trainer/admin/users`

### Features

- View all users (athletes and trainers)
- Create new athletes (pre-approved)
- Create new trainers
- Edit user information
- Manage roles
- Deactivate users

### Create Athlete (Admin)

```typescript
// src/app/api/admin/athletes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createAthleteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  youthCategory: z.enum(['F', 'E', 'D']),
  competitionParticipation: z.boolean().default(false),
  hasDtbId: z.boolean().default(false),
  trainingGroupIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const body = await request.json();

  const validation = createAthleteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Check email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'E-Mail-Adresse bereits vergeben' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user with pre-approved athlete profile
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
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
            youthCategory: data.youthCategory,
            competitionParticipation: data.competitionParticipation,
            hasDtbId: data.hasDtbId,
            isApproved: true, // Pre-approved
            approvedBy: trainerId,
            approvedAt: new Date(),
            configuredAt: new Date(),
          },
        },
      },
      include: { athleteProfile: true },
    });

    // Assign to training groups
    if (data.trainingGroupIds.length > 0) {
      await Promise.all(
        data.trainingGroupIds.map((groupId) =>
          tx.recurringTrainingAthleteAssignment.create({
            data: {
              trainingGroupId: groupId,
              athleteId: newUser.athleteProfile!.id,
              assignedBy: trainerId,
            },
          })
        )
      );
    }

    return newUser;
  });

  return NextResponse.json({
    data: user,
    message: 'Athlet erfolgreich erstellt',
  });
}
```

### Create Trainer

```typescript
// src/app/api/admin/trainers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createTrainerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  role: z.enum(['TRAINER', 'ADMIN']),
});

// GET - List all trainers
export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainers = await prisma.trainerProfile.findMany({
    include: { user: true },
    orderBy: { user: { lastName: 'asc' } },
  });

  return NextResponse.json({
    data: trainers.map((t) => ({
      id: t.id,
      email: t.user.email,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      phone: t.user.phone,
      role: t.role,
      isActive: t.isActive,
    })),
  });
}

// POST - Create new trainer
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const validation = createTrainerSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'E-Mail-Adresse bereits vergeben' },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      isTrainer: true,
      trainerProfile: {
        create: {
          role: data.role,
          isActive: true,
        },
      },
    },
    include: { trainerProfile: true },
  });

  return NextResponse.json({
    data: user,
    message: 'Trainer erfolgreich erstellt',
  });
}
```

---

## Competition Management

**Route**: `/trainer/admin/competitions`

### Features

- Create competitions
- Edit competition details
- Set eligibility requirements
- Publish/unpublish
- Cancel competitions
- View and manage registrations
- Record results

### Competition CRUD

```typescript
// src/app/api/admin/competitions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const competitionSchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  location: z.string().min(1),
  description: z.string().optional(),
  minYouthCategory: z.enum(['F', 'E', 'D']).optional(),
  maxYouthCategory: z.enum(['F', 'E', 'D']).optional(),
  registrationDeadline: z.string().optional(),
  maxParticipants: z.number().optional(),
  requiresDtbId: z.boolean().default(false),
  entryFee: z.number().optional(),
});

// GET - List competitions
export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const includeRegistrations = searchParams.get('includeRegistrations') === 'true';

  const competitions = await prisma.competition.findMany({
    include: {
      registrations: includeRegistrations
        ? {
            include: {
              athlete: { include: { user: true } },
            },
          }
        : false,
      createdByTrainer: { include: { user: true } },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json({ data: competitions });
}

// POST - Create competition
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const body = await request.json();

  const validation = competitionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const data = validation.data;

  const competition = await prisma.competition.create({
    data: {
      name: data.name,
      date: new Date(data.date),
      location: data.location,
      description: data.description,
      minYouthCategory: data.minYouthCategory,
      maxYouthCategory: data.maxYouthCategory,
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : null,
      maxParticipants: data.maxParticipants,
      requiresDtbId: data.requiresDtbId,
      entryFee: data.entryFee,
      createdBy: trainerId,
    },
  });

  return NextResponse.json({
    data: competition,
    message: 'Wettkampf erfolgreich erstellt',
  });
}
```

### Record Results

```typescript
// src/app/api/admin/competitions/[id]/registrations/[regId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; regId: string } }
) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();

  const registration = await prisma.competitionRegistration.update({
    where: { id: params.regId },
    data: {
      attended: body.attended,
      placement: body.placement,
      score: body.score,
    },
  });

  return NextResponse.json({
    data: registration,
    message: 'Ergebnis gespeichert',
  });
}
```

---

## System Settings

**Route**: `/trainer/admin/settings`

### Configurable Settings

| Setting                    | Type    | Default | Description                           |
| -------------------------- | ------- | ------- | ------------------------------------- |
| cancellationDeadlineHours  | Int     | 2       | Hours before session for cancellation |
| absenceAlertThreshold      | Int     | 3       | Unexcused absences to trigger alert   |
| absenceAlertWindowDays     | Int     | 30      | Days to count absences                |
| absenceAlertCooldownDays   | Int     | 14      | Days between alerts                   |
| absenceAlertEnabled        | Boolean | true    | Enable absence notifications          |
| adminNotificationEmail     | String  | ""      | Admin email for alerts                |
| maxUploadSizeMB            | Int     | 10      | Maximum file upload size              |
| sessionGenerationDaysAhead | Int     | 90      | Days ahead to generate sessions       |

### Settings API

```typescript
// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get current settings
export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });

  // Create default settings if not exist
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: 'default' },
    });
  }

  return NextResponse.json({ data: settings });
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const trainerId = session!.user.trainerProfileId!;
  const body = await request.json();

  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {
      cancellationDeadlineHours: body.cancellationDeadlineHours,
      absenceAlertThreshold: body.absenceAlertThreshold,
      absenceAlertWindowDays: body.absenceAlertWindowDays,
      absenceAlertCooldownDays: body.absenceAlertCooldownDays,
      absenceAlertEnabled: body.absenceAlertEnabled,
      adminNotificationEmail: body.adminNotificationEmail,
      maxUploadSizeMB: body.maxUploadSizeMB,
      sessionGenerationDaysAhead: body.sessionGenerationDaysAhead,
      lastModifiedBy: trainerId,
      lastModifiedAt: new Date(),
    },
    create: {
      id: 'default',
      ...body,
      lastModifiedBy: trainerId,
      lastModifiedAt: new Date(),
    },
  });

  return NextResponse.json({
    data: settings,
    message: 'Einstellungen gespeichert',
  });
}
```

### Settings Component

```typescript
// src/app/trainer/admin/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';

interface Settings {
  cancellationDeadlineHours: number;
  absenceAlertThreshold: number;
  absenceAlertWindowDays: number;
  absenceAlertCooldownDays: number;
  absenceAlertEnabled: boolean;
  adminNotificationEmail: string;
  maxUploadSizeMB: number;
  sessionGenerationDaysAhead: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data.data))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Einstellungen gespeichert');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;
  if (!settings) return <div>Fehler beim Laden</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Systemeinstellungen</h1>

      {/* Cancellation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Absagen</CardTitle>
          <CardDescription>Einstellungen für Trainingsabsagen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Absagefrist (Stunden vor Training)</Label>
            <Input
              type="number"
              min={0}
              value={settings.cancellationDeadlineHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cancellationDeadlineHours: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Absence Alert Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Abwesenheitsbenachrichtigungen</CardTitle>
          <CardDescription>Einstellungen für automatische Benachrichtigungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Benachrichtigungen aktiviert</Label>
            <Switch
              checked={settings.absenceAlertEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, absenceAlertEnabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Schwellenwert (unentschuldigte Abwesenheiten)</Label>
            <Input
              type="number"
              min={1}
              value={settings.absenceAlertThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  absenceAlertThreshold: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Zeitfenster (Tage)</Label>
            <Input
              type="number"
              min={1}
              value={settings.absenceAlertWindowDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  absenceAlertWindowDays: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Abklingzeit zwischen Benachrichtigungen (Tage)</Label>
            <Input
              type="number"
              min={1}
              value={settings.absenceAlertCooldownDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  absenceAlertCooldownDays: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Admin-E-Mail für Benachrichtigungen</Label>
            <Input
              type="email"
              value={settings.adminNotificationEmail}
              onChange={(e) =>
                setSettings({ ...settings, adminNotificationEmail: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* File Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Dateien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Maximale Dateigröße (MB)</Label>
            <Input
              type="number"
              min={1}
              value={settings.maxUploadSizeMB}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxUploadSizeMB: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Session Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Trainingseinheiten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Automatische Generierung (Tage im Voraus)</Label>
            <Input
              type="number"
              min={1}
              value={settings.sessionGenerationDaysAhead}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  sessionGenerationDaysAhead: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Speichern...' : 'Einstellungen speichern'}
      </Button>
    </div>
  );
}
```

---

## Trainer Hours Management

**Route**: `/trainer/admin/hours`

### Features

- View monthly trainer hour summaries
- Auto-calculated from completed sessions
- Manual adjustments with notes
- CSV export

### API Endpoint

```typescript
// src/app/api/admin/trainer-hours/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const searchParams = request.nextUrl.searchParams;
  const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '');
  const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '');

  // Get all trainers
  const trainers = await prisma.trainerProfile.findMany({
    where: { isActive: true },
    include: { user: true },
  });

  // Get or create summaries
  const summaries = await Promise.all(
    trainers.map(async (trainer) => {
      // Check for existing summary
      let summary = await prisma.monthlyTrainerSummary.findUnique({
        where: {
          month_year_trainerId: { month, year, trainerId: trainer.id },
        },
      });

      // Calculate hours from completed sessions
      const sessions = await prisma.trainingSession.findMany({
        where: {
          date: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
          isCompleted: true,
          sessionGroups: {
            some: {
              trainerAssignments: {
                some: { trainerId: trainer.id },
              },
            },
          },
        },
        include: {
          recurringTraining: true,
        },
      });

      // Calculate total hours
      let calculatedHours = 0;
      for (const s of sessions) {
        const startTime = s.startTime || s.recurringTraining?.startTime || '00:00';
        const endTime = s.endTime || s.recurringTraining?.endTime || '00:00';
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const hours = (endH * 60 + endM - startH * 60 - startM) / 60;
        calculatedHours += hours;
      }

      // Create or update summary
      if (!summary) {
        summary = await prisma.monthlyTrainerSummary.create({
          data: {
            month,
            year,
            trainerId: trainer.id,
            calculatedHours,
            finalHours: calculatedHours,
          },
        });
      } else if (summary.calculatedHours !== calculatedHours) {
        summary = await prisma.monthlyTrainerSummary.update({
          where: { id: summary.id },
          data: {
            calculatedHours,
            finalHours: summary.adjustedHours ?? calculatedHours,
          },
        });
      }

      return {
        trainerId: trainer.id,
        trainerName: `${trainer.user.firstName} ${trainer.user.lastName}`,
        calculatedHours: Number(summary.calculatedHours),
        adjustedHours: summary.adjustedHours ? Number(summary.adjustedHours) : null,
        finalHours: Number(summary.finalHours),
        notes: summary.notes,
        sessionCount: sessions.length,
      };
    })
  );

  return NextResponse.json({ data: summaries });
}
```

---

## File Categories Management

```typescript
// src/app/api/admin/file-categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - List categories
export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const categories = await prisma.uploadCategory.findMany({
    include: {
      _count: { select: { uploads: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ data: categories });
}

// POST - Create category
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { name, description } = await request.json();

  const maxOrder = await prisma.uploadCategory.aggregate({
    _max: { sortOrder: true },
  });

  const category = await prisma.uploadCategory.create({
    data: {
      name,
      description,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
    },
  });

  return NextResponse.json({
    data: category,
    message: 'Kategorie erstellt',
  });
}
```

---

## Testing Checklist

### Recurring Trainings
- [ ] Can create new training
- [ ] Time validation works
- [ ] Can edit training details
- [ ] Can delete training (cascade works)
- [ ] Validity dates respected

### Training Groups
- [ ] Can create groups
- [ ] Can add athletes to group
- [ ] Can remove athletes from group
- [ ] Can add trainers to group
- [ ] Sort order respected

### User Management
- [ ] Can list all users
- [ ] Can create pre-approved athlete
- [ ] Can create trainer
- [ ] Can set trainer role
- [ ] Email uniqueness enforced

### Competitions
- [ ] Can create competition
- [ ] Can set eligibility rules
- [ ] Can publish/unpublish
- [ ] Can view registrations
- [ ] Can record results

### System Settings
- [ ] All settings load correctly
- [ ] Settings save correctly
- [ ] Settings affect behavior (test cancellation deadline)

### Trainer Hours
- [ ] Hours calculated correctly
- [ ] Manual adjustments work
- [ ] Export produces valid CSV