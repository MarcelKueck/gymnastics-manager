# SV Esting Gymnastics Manager

## Project Overview

**Application**: Training Management System for SV Esting Turnen (German gymnastics club)
**Language**: German UI, English codebase
**Type**: Full-stack web application

## Quick Reference

| Aspect    | Details                   |
| --------- | ------------------------- |
| Framework | Next.js 14 (App Router)   |
| Language  | TypeScript (strict mode)  |
| Database  | PostgreSQL + Prisma ORM   |
| Auth      | NextAuth.js (Credentials) |
| Styling   | Tailwind CSS + shadcn/ui  |
| Email     | Resend API                |

## Documentation Index

Read these documents in order during initial setup, then reference as needed:

| Document                                                   | Purpose                          | When to Read                         |
| ---------------------------------------------------------- | -------------------------------- | ------------------------------------ |
| [01-IMPLEMENTATION-GUIDE.md](./01-IMPLEMENTATION-GUIDE.md) | Phase-by-phase build plan        | **Start here** - Follow sequentially |
| [02-DATA-MODELS.md](./02-DATA-MODELS.md)                   | Database schema & relationships  | Phase 1 - Foundation                 |
| [03-AUTHENTICATION.md](./03-AUTHENTICATION.md)             | Auth system & role handling      | Phase 2 - Authentication             |
| [04-FEATURES-ATHLETE.md](./04-FEATURES-ATHLETE.md)         | Athlete dashboard & features     | Phase 3+ - Features                  |
| [05-FEATURES-TRAINER.md](./05-FEATURES-TRAINER.md)         | Trainer dashboard & features     | Phase 3+ - Features                  |
| [06-FEATURES-ADMIN.md](./06-FEATURES-ADMIN.md)             | Admin management features        | Phase 3+ - Features                  |
| [07-API-REFERENCE.md](./07-API-REFERENCE.md)               | Complete API endpoint specs      | Reference during development         |
| [08-UI-PATTERNS.md](./08-UI-PATTERNS.md)                   | Component patterns & conventions | Reference during development         |
| [09-CONFIGURATION.md](./09-CONFIGURATION.md)               | Environment & deployment         | Setup and deployment                 |

## Core Business Concepts

### Dual Role System
Users can have **both** athlete and trainer profiles simultaneously. A person might train others while also participating as an athlete in different sessions.

```
User
├── isAthlete: true → AthleteProfile (attends trainings)
└── isTrainer: true → TrainerProfile (conducts trainings)
```

### Training Hierarchy
```
RecurringTraining (template: "Monday Advanced", weekly, 18:00-20:00)
├── TrainingGroup: "Beginners"
│   ├── Athletes: [Alice, Bob]
│   └── Trainers: [Coach Mike]
├── TrainingGroup: "Competition"
│   ├── Athletes: [Carol, Dave]
│   └── Trainers: [Coach Sarah]
│
└── Generates → TrainingSession (concrete instance: 2025-01-13)
    ├── SessionGroup: "Beginners" → attendance tracked here
    └── SessionGroup: "Competition" → attendance tracked here
```

### User Roles

| Role    | Access                            | Description                                    |
| ------- | --------------------------------- | ---------------------------------------------- |
| ATHLETE | `/athlete/*`                      | Views schedule, cancels sessions, sees results |
| TRAINER | `/trainer/*`                      | Marks attendance, manages athletes             |
| ADMIN   | `/trainer/*` + `/trainer/admin/*` | Full system configuration                      |

### Youth Categories (German Gymnastics Federation)
- **F**: Youngest/beginner level
- **E**: Intermediate level  
- **D**: Advanced level

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (organized by role)
│   │   ├── admin/               # Admin-only endpoints
│   │   ├── athlete/             # Athlete endpoints
│   │   ├── trainer/             # Trainer endpoints
│   │   ├── auth/                # NextAuth + role switching
│   │   └── files/               # File handling
│   ├── athlete/                  # Athlete pages
│   ├── trainer/                  # Trainer pages (includes admin)
│   ├── login/                    # Public login
│   └── register/                 # Public registration
├── components/
│   ├── ui/                       # Base UI (shadcn/ui)
│   ├── athlete/                  # Athlete-specific
│   ├── trainer/                  # Trainer-specific
│   ├── admin/                    # Admin-specific
│   └── shared/                   # Cross-role components
├── lib/
│   ├── api/                      # API helpers
│   ├── repositories/             # Data access layer
│   ├── services/                 # Business logic
│   ├── validation/               # Zod schemas
│   ├── constants/                # Enums, labels
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client
│   └── email.ts                  # Email service
└── prisma/
    ├── schema.prisma             # Database schema
    └── seed.ts                   # Seed data
```

## Key Implementation Patterns

### Repository Pattern
Data access goes through repositories, not direct Prisma calls in routes:

```typescript
// ✓ Correct
import { athleteRepository } from '@/lib/repositories/athleteRepository';
const athlete = await athleteRepository.findById(id);

// ✗ Avoid
import { prisma } from '@/lib/prisma';
const athlete = await prisma.athleteProfile.findUnique({ where: { id } });
```

### Service Layer
Business logic lives in services:

```typescript
// lib/services/athleteService.ts
export const athleteService = {
  async approveAndConfigure(athleteId, trainerId, config) {
    // Complex business logic with transactions
  }
};
```

### API Response Format

```typescript
// Success
return NextResponse.json({ data: result, message: 'Optional message' });

// Error
return NextResponse.json({ error: 'Error message' }, { status: 400 });
```

### German Language Convention
All user-facing strings in German. Use constants for consistency:

```typescript
// lib/constants/labels.ts
export const LABELS = {
  attendance: {
    PRESENT: 'Anwesend',
    ABSENT_UNEXCUSED: 'Unentschuldigt abwesend',
    ABSENT_EXCUSED: 'Entschuldigt abwesend',
  }
};
```

## Getting Started

1. **Read the Implementation Guide**: Start with [01-IMPLEMENTATION-GUIDE.md](./01-IMPLEMENTATION-GUIDE.md)
2. **Follow phases sequentially**: Each phase builds on the previous
3. **Reference other docs as needed**: Use the index above to find specific details
4. **Test each phase**: Verify functionality before moving on

## Success Criteria

The application is complete when:
- [ ] All three user roles can log in and access appropriate dashboards
- [ ] Athletes can view schedules and cancel sessions
- [ ] Trainers can mark attendance and manage athletes
- [ ] Admins can configure trainings, users, and system settings
- [ ] Sessions auto-generate based on recurring training templates
- [ ] Absence alerts trigger based on configurable thresholds
- [ ] File upload/download works for training documents
- [ ] Competition registration and results tracking works