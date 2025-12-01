# Data Models

## Overview

This document contains the complete database schema for the Gymnastics Manager application. The schema is designed for PostgreSQL using Prisma ORM.

## Entity Relationship Summary

```
User (1) ←→ (0..1) AthleteProfile
User (1) ←→ (0..1) TrainerProfile

RecurringTraining (1) ←→ (N) TrainingGroup
TrainingGroup (1) ←→ (N) RecurringTrainingAthleteAssignment
TrainingGroup (1) ←→ (N) RecurringTrainingTrainerAssignment

RecurringTraining (1) ←→ (N) TrainingSession
TrainingSession (1) ←→ (N) SessionGroup
SessionGroup (N) ←→ (1) TrainingGroup

AthleteProfile (1) ←→ (N) Cancellation
AthleteProfile (1) ←→ (N) AttendanceRecord
AthleteProfile (1) ←→ (N) CompetitionRegistration

Competition (1) ←→ (N) CompetitionRegistration
```

## Complete Prisma Schema

Copy this entire schema to `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  ATHLETE
  TRAINER
  ADMIN
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum YouthCategory {
  F
  E
  D
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum RecurrenceInterval {
  ONCE
  WEEKLY
  BIWEEKLY
  MONTHLY
}

enum AttendanceStatus {
  PRESENT
  ABSENT_UNEXCUSED
  ABSENT_EXCUSED
}

// ============================================================================
// USER MODELS
// ============================================================================

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  firstName    String
  lastName     String
  phone        String
  birthDate    DateTime?
  gender       Gender?

  // Dual role flags
  isAthlete Boolean @default(false)
  isTrainer Boolean @default(false)

  // Profile relationships
  athleteProfile AthleteProfile?
  trainerProfile TrainerProfile?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([isAthlete, isTrainer])
}

model AthleteProfile {
  id     String @id @default(cuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Guardian information (for minors)
  guardianName          String?
  guardianEmail         String?
  guardianPhone         String?
  emergencyContactName  String?
  emergencyContactPhone String?

  // Training configuration (managed by trainers)
  youthCategory            YouthCategory @default(F)
  competitionParticipation Boolean       @default(false)
  hasDtbId                 Boolean       @default(false)

  // Approval status
  isApproved        Boolean         @default(false)
  approvedBy        String?
  approvedByTrainer TrainerProfile? @relation("AthleteApprovals", fields: [approvedBy], references: [id])
  approvedAt        DateTime?
  configuredAt      DateTime?

  // Preferences
  autoConfirmFutureSessions Boolean @default(false)

  // Relationships
  recurringTrainingAssignments RecurringTrainingAthleteAssignment[]
  sessionAthleteAssignments    SessionAthleteAssignment[]
  cancellations                Cancellation[]
  attendanceRecords            AttendanceRecord[]
  absenceAlerts                AbsenceAlert[]
  competitionRegistrations     CompetitionRegistration[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([isApproved])
  @@index([youthCategory])
}

model TrainerProfile {
  id       String   @id @default(cuid())
  userId   String   @unique
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role     UserRole @default(TRAINER)
  isActive Boolean  @default(true)

  // Relationships
  approvedAthletes              AthleteProfile[]                     @relation("AthleteApprovals")
  createdRecurringTrainings     RecurringTraining[]                  @relation("RecurringTrainingCreator")
  recurringTrainingAssignments  RecurringTrainingTrainerAssignment[] @relation("RecurringTrainingAssignments")
  recurringAthleteAssignments   RecurringTrainingAthleteAssignment[] @relation("AthleteAssignmentCreator")
  trainerAssignmentsCreated     RecurringTrainingTrainerAssignment[] @relation("TrainerAssignmentCreator")
  sessionGroupAssignments       SessionGroupTrainerAssignment[]
  sessionAthleteReassignments   SessionAthleteAssignment[]           @relation("SessionAthleteReassignments")
  uploads                       Upload[]
  attendanceMarked              AttendanceRecord[]
  auditLogs                     AuditLog[]
  monthlyHoursSummaries         MonthlyTrainerSummary[]              @relation("TrainerMonthlySummaries")
  modifiedMonthlyHoursSummaries MonthlyTrainerSummary[]              @relation("TrainerSummaryModifier")
  modifiedSystemSettings        SystemSettings[]
  createdCompetitions           Competition[]                        @relation("CompetitionCreator")
  cancelledSessions             TrainingSession[]                    @relation("SessionCanceller")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([role])
  @@index([isActive])
}

// ============================================================================
// TRAINING STRUCTURE MODELS
// ============================================================================

model RecurringTraining {
  id         String             @id @default(cuid())
  name       String
  dayOfWeek  DayOfWeek
  startTime  String             // HH:MM format
  endTime    String             // HH:MM format
  recurrence RecurrenceInterval @default(WEEKLY)
  isActive   Boolean            @default(true)
  validFrom  DateTime?
  validUntil DateTime?

  createdBy        String
  createdByTrainer TrainerProfile @relation("RecurringTrainingCreator", fields: [createdBy], references: [id])

  // Relationships
  trainingGroups   TrainingGroup[]
  trainingSessions TrainingSession[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([dayOfWeek])
  @@index([isActive])
}

model TrainingGroup {
  id                  String            @id @default(cuid())
  recurringTrainingId String
  recurringTraining   RecurringTraining @relation(fields: [recurringTrainingId], references: [id], onDelete: Cascade)
  name                String
  sortOrder           Int               @default(0)

  // Relationships
  athleteAssignments RecurringTrainingAthleteAssignment[]
  trainerAssignments RecurringTrainingTrainerAssignment[]
  sessionGroups      SessionGroup[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([recurringTrainingId])
}

model RecurringTrainingAthleteAssignment {
  id              String         @id @default(cuid())
  trainingGroupId String
  trainingGroup   TrainingGroup  @relation(fields: [trainingGroupId], references: [id], onDelete: Cascade)
  athleteId       String
  athlete         AthleteProfile @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  assignedBy      String
  assignedByTrainer TrainerProfile @relation("AthleteAssignmentCreator", fields: [assignedBy], references: [id])
  assignedAt      DateTime       @default(now())

  @@unique([trainingGroupId, athleteId])
  @@index([trainingGroupId])
  @@index([athleteId])
}

model RecurringTrainingTrainerAssignment {
  id              String         @id @default(cuid())
  trainingGroupId String
  trainingGroup   TrainingGroup  @relation(fields: [trainingGroupId], references: [id], onDelete: Cascade)
  trainerId       String
  trainer         TrainerProfile @relation("RecurringTrainingAssignments", fields: [trainerId], references: [id], onDelete: Cascade)
  isPrimary       Boolean        @default(false)
  effectiveFrom   DateTime?
  effectiveUntil  DateTime?
  assignedBy      String
  assignedByTrainer TrainerProfile @relation("TrainerAssignmentCreator", fields: [assignedBy], references: [id])

  @@unique([trainingGroupId, trainerId])
  @@index([trainingGroupId])
  @@index([trainerId])
}

// ============================================================================
// SESSION MODELS
// ============================================================================

model TrainingSession {
  id                  String             @id @default(cuid())
  date                DateTime
  dayOfWeek           DayOfWeek
  startTime           String?            // Override from recurring
  endTime             String?            // Override from recurring
  recurringTrainingId String?
  recurringTraining   RecurringTraining? @relation(fields: [recurringTrainingId], references: [id], onDelete: SetNull)
  notes               String?
  isCompleted         Boolean            @default(false)
  isCancelled         Boolean            @default(false)
  cancelledBy         String?
  cancelledByTrainer  TrainerProfile?    @relation("SessionCanceller", fields: [cancelledBy], references: [id])
  cancelledAt         DateTime?
  cancellationReason  String?

  // Relationships
  sessionGroups              SessionGroup[]
  sessionAthleteAssignments  SessionAthleteAssignment[]
  cancellations              Cancellation[]
  attendanceRecords          AttendanceRecord[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([recurringTrainingId])
  @@index([isCancelled])
}

model SessionGroup {
  id                String          @id @default(cuid())
  trainingSessionId String
  trainingSession   TrainingSession @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  trainingGroupId   String
  trainingGroup     TrainingGroup   @relation(fields: [trainingGroupId], references: [id], onDelete: Cascade)
  exercises         String?         // Exercise plan for this session
  notes             String?

  // Relationships
  trainerAssignments SessionGroupTrainerAssignment[]

  @@unique([trainingSessionId, trainingGroupId])
  @@index([trainingSessionId])
  @@index([trainingGroupId])
}

model SessionGroupTrainerAssignment {
  id             String         @id @default(cuid())
  sessionGroupId String
  sessionGroup   SessionGroup   @relation(fields: [sessionGroupId], references: [id], onDelete: Cascade)
  trainerId      String?
  trainer        TrainerProfile? @relation(fields: [trainerId], references: [id], onDelete: SetNull)

  @@index([sessionGroupId])
  @@index([trainerId])
}

model SessionAthleteAssignment {
  id                String          @id @default(cuid())
  trainingSessionId String
  trainingSession   TrainingSession @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  sessionGroupId    String
  athleteId         String
  athlete           AthleteProfile  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  movedBy           String
  movedByTrainer    TrainerProfile  @relation("SessionAthleteReassignments", fields: [movedBy], references: [id])
  movedAt           DateTime        @default(now())
  reason            String?

  @@unique([trainingSessionId, athleteId])
  @@index([trainingSessionId])
  @@index([athleteId])
}

// ============================================================================
// ATTENDANCE MODELS
// ============================================================================

model Cancellation {
  id                String          @id @default(cuid())
  athleteId         String
  athlete           AthleteProfile  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  trainingSessionId String
  trainingSession   TrainingSession @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  reason            String          // Minimum 10 characters
  cancelledAt       DateTime        @default(now())
  isActive          Boolean         @default(true)
  undoneAt          DateTime?

  @@unique([athleteId, trainingSessionId])
  @@index([athleteId])
  @@index([trainingSessionId])
  @@index([isActive])
}

model AttendanceRecord {
  id                String           @id @default(cuid())
  athleteId         String
  athlete           AthleteProfile   @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  trainingSessionId String
  trainingSession   TrainingSession  @relation(fields: [trainingSessionId], references: [id], onDelete: Cascade)
  status            AttendanceStatus
  markedBy          String
  markedByTrainer   TrainerProfile   @relation(fields: [markedBy], references: [id])
  markedAt          DateTime         @default(now())
  lastModifiedBy    String?
  lastModifiedAt    DateTime?
  modificationReason String?
  notes             String?

  @@unique([athleteId, trainingSessionId])
  @@index([athleteId])
  @@index([trainingSessionId])
  @@index([status])
}

// ============================================================================
// COMPETITION MODELS
// ============================================================================

model Competition {
  id                   String         @id @default(cuid())
  name                 String
  date                 DateTime
  location             String
  description          String?
  minYouthCategory     YouthCategory?
  maxYouthCategory     YouthCategory?
  registrationDeadline DateTime?
  maxParticipants      Int?
  requiresDtbId        Boolean        @default(false)
  entryFee             Decimal?       @db.Decimal(10, 2)
  isPublished          Boolean        @default(false)
  isCancelled          Boolean        @default(false)
  createdBy            String
  createdByTrainer     TrainerProfile @relation("CompetitionCreator", fields: [createdBy], references: [id])

  // Relationships
  registrations CompetitionRegistration[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([date])
  @@index([isPublished])
}

model CompetitionRegistration {
  id            String         @id @default(cuid())
  competitionId String
  competition   Competition    @relation(fields: [competitionId], references: [id], onDelete: Cascade)
  athleteId     String
  athlete       AthleteProfile @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  registeredAt  DateTime       @default(now())
  notes         String?
  attended      Boolean?
  placement     Int?
  score         Decimal?       @db.Decimal(10, 2)

  @@unique([competitionId, athleteId])
  @@index([competitionId])
  @@index([athleteId])
}

// ============================================================================
// FILE MANAGEMENT MODELS
// ============================================================================

model UploadCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)

  // Relationships
  uploads Upload[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Upload {
  id           String          @id @default(cuid())
  categoryId   String
  category     UploadCategory  @relation(fields: [categoryId], references: [id])
  title        String
  targetDate   String?         // e.g., "KW 23" for week 23
  filePath     String
  fileName     String
  fileSize     Int
  mimeType     String
  uploadedBy   String
  uploadedByTrainer TrainerProfile @relation(fields: [uploadedBy], references: [id])
  uploadedAt   DateTime        @default(now())
  version      Int             @default(1)
  replacedBy   String?
  isActive     Boolean         @default(true)

  @@index([categoryId])
  @@index([isActive])
}

// ============================================================================
// ADMINISTRATIVE MODELS
// ============================================================================

model SystemSettings {
  id                        String  @id @default("default")
  cancellationDeadlineHours Int     @default(2)
  absenceAlertThreshold     Int     @default(3)
  absenceAlertWindowDays    Int     @default(30)
  absenceAlertCooldownDays  Int     @default(14)
  adminNotificationEmail    String  @default("")
  absenceAlertEnabled       Boolean @default(true)
  maxUploadSizeMB           Int     @default(10)
  sessionGenerationDaysAhead Int    @default(90)

  lastModifiedBy      String?
  lastModifiedByTrainer TrainerProfile? @relation(fields: [lastModifiedBy], references: [id])
  lastModifiedAt      DateTime?
}

model AbsenceAlert {
  id                  String         @id @default(cuid())
  athleteId           String
  athlete             AthleteProfile @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  absenceCount        Int
  absencePeriodStart  DateTime
  absencePeriodEnd    DateTime
  sentAt              DateTime       @default(now())
  emailSentToAthlete  Boolean        @default(false)
  emailSentToAdmin    Boolean        @default(false)

  @@index([athleteId])
  @@index([sentAt])
}

model AuditLog {
  id           String         @id @default(cuid())
  entityType   String         // 'athlete', 'training', 'attendance', etc.
  entityId     String
  action       String         // 'create', 'update', 'delete', 'approve', etc.
  changes      Json           // { field: { old: value, new: value } }
  performedBy  String
  performedByTrainer TrainerProfile @relation(fields: [performedBy], references: [id])
  performedAt  DateTime       @default(now())
  reason       String?

  @@index([entityType, entityId])
  @@index([performedBy])
  @@index([performedAt])
}

model MonthlyTrainerSummary {
  id              String          @id @default(cuid())
  month           Int             // 1-12
  year            Int
  trainerId       String
  trainer         TrainerProfile  @relation("TrainerMonthlySummaries", fields: [trainerId], references: [id], onDelete: Cascade)
  calculatedHours Decimal         @db.Decimal(10, 2)
  adjustedHours   Decimal?        @db.Decimal(10, 2)
  finalHours      Decimal         @db.Decimal(10, 2)
  notes           String?
  lastModifiedBy  String?
  lastModifiedByTrainer TrainerProfile? @relation("TrainerSummaryModifier", fields: [lastModifiedBy], references: [id])
  lastModifiedAt  DateTime?

  @@unique([month, year, trainerId])
  @@index([trainerId])
  @@index([year, month])
}
```

## Model Details

### User & Profiles

The **User** model is the central identity. Two boolean flags indicate which profiles exist:

| Flag              | Profile Created       |
| ----------------- | --------------------- |
| `isAthlete: true` | AthleteProfile exists |
| `isTrainer: true` | TrainerProfile exists |

Both flags can be true simultaneously for dual-role users.

**AthleteProfile** contains:
- Guardian info for minors
- Youth category classification
- Approval workflow status
- Competition eligibility flags

**TrainerProfile** contains:
- Role (TRAINER or ADMIN)
- Active status flag

### Training Structure

**RecurringTraining** is a template defining when training occurs (day, time, recurrence).

**TrainingGroup** subdivides a training into groups (e.g., "Beginners", "Competition").

**Assignments** link athletes and trainers to groups on a recurring basis.

### Session Generation

**TrainingSession** is a concrete instance of training on a specific date.

**SessionGroup** is an instance of TrainingGroup for that session, allowing per-session notes/exercises.

Sessions inherit configuration from RecurringTraining but can override times and have session-specific data.

### Attendance Flow

1. **Cancellation**: Athlete-initiated before deadline
2. **AttendanceRecord**: Trainer-marked after session

A cancellation automatically suggests ABSENT_EXCUSED status during attendance marking.

### Competition Registration

Athletes register for competitions, subject to eligibility rules:
- Youth category range
- DTB ID requirement
- Registration deadline
- Capacity limits

After competition, trainers record attended status, placement, and score.

## Query Patterns

### Get athlete with all training assignments

```typescript
const athlete = await prisma.athleteProfile.findUnique({
  where: { id: athleteId },
  include: {
    user: true,
    recurringTrainingAssignments: {
      include: {
        trainingGroup: {
          include: {
            recurringTraining: true,
          },
        },
      },
    },
  },
});
```

### Get upcoming sessions for athlete

```typescript
const sessions = await prisma.trainingSession.findMany({
  where: {
    date: { gte: new Date() },
    isCancelled: false,
    recurringTraining: {
      trainingGroups: {
        some: {
          athleteAssignments: {
            some: { athleteId },
          },
        },
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
});
```

### Get session with full attendance data

```typescript
const session = await prisma.trainingSession.findUnique({
  where: { id: sessionId },
  include: {
    recurringTraining: {
      include: {
        trainingGroups: {
          include: {
            athleteAssignments: {
              include: {
                athlete: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    },
    attendanceRecords: true,
    cancellations: { where: { isActive: true } },
  },
});
```

## Database Initialization

After creating the schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name init

# Open database GUI
npx prisma studio
```

## Seeding

Create `prisma/seed.ts` with test data:

```typescript
import { PrismaClient, UserRole, YouthCategory, DayOfWeek } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@svesting.de',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+49123456789',
      isTrainer: true,
      trainerProfile: {
        create: { role: UserRole.ADMIN },
      },
    },
  });

  // Create system settings
  await prisma.systemSettings.create({
    data: {
      id: 'default',
      adminNotificationEmail: 'admin@svesting.de',
    },
  });

  // Create upload categories
  await prisma.uploadCategory.createMany({
    data: [
      { name: 'Trainingspläne', sortOrder: 1 },
      { name: 'Wettkampfinfos', sortOrder: 2 },
      { name: 'Allgemein', sortOrder: 3 },
    ],
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run with:

```bash
npx prisma db seed
```