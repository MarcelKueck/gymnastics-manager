# Training Structure - Visual Diagrams

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         ADMIN LAYER                          │
│  Creates recurring trainings & manages group assignments     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   RECURRING TRAINING                         │
│  "Montag 17:00-18:30"                                        │
│  ├─ TrainingGroup: "Anfänger"                               │
│  │   ├─ Athletes: [Anna, Ben, Clara]                        │
│  │   └─ Trainers: [Trainer A]                               │
│  ├─ TrainingGroup: "Fortgeschrittene"                       │
│  │   ├─ Athletes: [David, Emma]                             │
│  │   └─ Trainers: [Trainer B, Trainer C]                    │
│  └─ TrainingGroup: "Wettkampf"                              │
│      ├─ Athletes: [Felix]                                    │
│      └─ Trainers: [Trainer C]                               │
└─────────────────────┬───────────────────────────────────────┘
                      │ Session Generation
                      │ (Creates for next 12 weeks)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING SESSION                          │
│  Date: 2025-10-27 (Monday)                                   │
│  ├─ SessionGroup: "Anfänger"                                │
│  │   ├─ Exercises: "Rolle vorwärts, Handstand..."          │
│  │   ├─ Athletes: [Anna✓, Ben✓, Clara✗]                   │
│  │   └─ Trainers: [Trainer A]                               │
│  ├─ SessionGroup: "Fortgeschrittene"                        │
│  │   ├─ Exercises: "Überschlag, Salto..."                  │
│  │   ├─ Athletes: [David✓, Emma✓, Ben*]  ← moved!         │
│  │   └─ Trainers: [Trainer B, Trainer C]                    │
│  └─ SessionGroup: "Wettkampf"                               │
│      ├─ Exercises: "Wettkampf-Kür üben..."                 │
│      ├─ Athletes: [Felix✓]                                  │
│      └─ Trainers: [Trainer C]                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      ATHLETE VIEW                            │
│  Anna sees:                                                  │
│  ├─ Monday 17:00-18:30: Gruppe "Anfänger"                   │
│  │   └─ Exercises: "Rolle vorwärts, Handstand..."          │
│  └─ Thursday 18:00-19:30: Gruppe "Fortgeschrittene"        │
│      └─ Exercises: "Sprünge am Balken..."                  │
└─────────────────────────────────────────────────────────────┘

Legend:
  ✓ = Present
  ✗ = Absent (excused/unexcused)
  * = Temporarily moved (returns to default next week)
```

---

## 📊 Data Flow Diagram

```
┌──────────┐
│  ADMIN   │
└────┬─────┘
     │
     │ 1. Creates RecurringTraining
     │    with named groups
     ▼
┌─────────────────────┐
│ RecurringTraining   │
│ ├─ TrainingGroup 1  │
│ ├─ TrainingGroup 2  │
│ └─ TrainingGroup 3  │
└────┬────────────────┘
     │
     │ 2. Admin assigns athletes & trainers
     │    to each TrainingGroup
     ▼
┌─────────────────────────┐
│ Assignments             │
│ ├─ Athlete→TrainingGroup│
│ └─ Trainer→TrainingGroup│
└────┬────────────────────┘
     │
     │ 3. System generates
     │    sessions weekly
     ▼
┌─────────────────────┐
│ TrainingSession     │
│ ├─ SessionGroup 1   │
│ ├─ SessionGroup 2   │
│ └─ SessionGroup 3   │
└────┬────────────────┘
     │
     │ 4. Trainer enters
     │    exercises & attendance
     ▼
┌─────────────────────┐
│ SessionGroup        │
│ ├─ exercises (text) │
│ ├─ notes            │
│ └─ attendance       │
└────┬────────────────┘
     │
     │ 5. (Optional)
     │    Trainer drags athlete
     │    to different group
     ▼
┌──────────────────────────┐
│ SessionAthleteAssignment │
│ (one-time override)      │
└──────────────────────────┘
```

---

## 🔄 Weekly Training Cycle

```
┌──────────────────────────────────────────────────────────┐
│                      WEEK 1                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Monday Session - "Anfänger" Group                  │  │
│ │ Trainer enters: "Rolle vorwärts, Handstand üben"  │  │
│ │ All athletes present ✓                             │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
                          │ Next week...
                          ▼
┌──────────────────────────────────────────────────────────┐
│                      WEEK 2                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Monday Session - "Anfänger" Group                  │  │
│ │                                                     │  │
│ │ [Show Last Week] ← Button shows:                   │  │
│ │   "Rolle vorwärts, Handstand üben"                │  │
│ │                                                     │  │
│ │ Trainer enters: "Rolle rückwärts, Handstand..."   │  │
│ │ 1 athlete absent (sick) ✗                          │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 👥 Athlete Assignment Matrix

```
                    MONDAY          THURSDAY        FRIDAY
                 17:00-18:30      18:00-19:30    16:00-17:30
              ┌──────────────────────────────────────────────┐
Anna          │  Anfänger       Fortgeschrittene    -        │
              ├──────────────────────────────────────────────┤
Ben           │  Anfänger           -            Anfänger    │
              ├──────────────────────────────────────────────┤
Clara         │  Anfänger       Anfänger            -        │
              ├──────────────────────────────────────────────┤
David         │ Fortgeschrittene Fortgeschrittene Wettkampf │
              ├──────────────────────────────────────────────┤
Emma          │ Fortgeschrittene    -          Fortgeschrittene│
              ├──────────────────────────────────────────────┤
Felix         │  Wettkampf      Wettkampf      Wettkampf    │
              └──────────────────────────────────────────────┘

✅ VALID: Athletes in different groups across different sessions
❌ INVALID: Athlete in 2+ groups in same session (blocked by validation)
```

---

## 🎯 Age Group Classification

```
                     2025 Age Groups
        ┌─────────────────────────────────────┐
        │                                     │
2017/16 │  E-Jugend (8-9 years old)          │
        │  ├─ Anna (2017)                     │
        │  └─ Ben (2016)                      │
        ├─────────────────────────────────────┤
2015/14 │  D-Jugend (10-11 years old)        │
        │  ├─ Clara (2015)                    │
        │  └─ David (2014)                    │
        ├─────────────────────────────────────┤
2013/12 │  C-Jugend (12-13 years old)        │
        │  └─ Emma (2013)                     │
        ├─────────────────────────────────────┤
2011-08 │  AB-Jugend (14-17 years old)       │
        │  └─ Felix (2010)                    │
        ├─────────────────────────────────────┤
≤2007   │  Turnerinnen (18+ years old)       │
        │  └─ [Adult athletes]                │
        └─────────────────────────────────────┘

Auto-updates on January 1st each year!
```

---

## 🔀 Drag-and-Drop Flow

```
NORMAL ASSIGNMENT (Recurring):
┌────────────────────────────────────────────────┐
│ Monday Session                                 │
│                                                │
│ ┌──────────────┐      ┌──────────────┐       │
│ │  Anfänger    │      │Fortgeschrittene│      │
│ │              │      │                │      │
│ │ • Anna       │      │ • David        │      │
│ │ • Ben        │      │ • Emma         │      │
│ │ • Clara      │      │                │      │
│ └──────────────┘      └──────────────┘       │
└────────────────────────────────────────────────┘

ONE-TIME MOVE (This session only):
┌────────────────────────────────────────────────┐
│ Monday Session (2025-10-27)                    │
│                                                │
│ ┌──────────────┐      ┌──────────────┐       │
│ │  Anfänger    │      │Fortgeschrittene│      │
│ │              │      │                │      │
│ │ • Anna       │──┐   │ • David        │      │
│ │              │  │   │ • Emma         │      │
│ │ • Clara      │  │   │ • Ben *        │←─────┤
│ └──────────────┘  │   └──────────────┘       │
│                   │                            │
│                   └→ Drag Ben here            │
│                      (too many absences in    │
│                       Anfänger group)          │
└────────────────────────────────────────────────┘
        Reason: "Only 2 athletes in Anfänger"

NEXT WEEK (Automatic reset):
┌────────────────────────────────────────────────┐
│ Monday Session (2025-11-03)                    │
│                                                │
│ ┌──────────────┐      ┌──────────────┐       │
│ │  Anfänger    │      │Fortgeschrittene│      │
│ │              │      │                │      │
│ │ • Anna       │      │ • David        │      │
│ │ • Ben ←──────┼──────┤ • Emma         │      │
│ │ • Clara      │      │                │      │
│ └──────────────┘      └──────────────┘       │
│                                                │
│   Ben is back in default group!                │
└────────────────────────────────────────────────┘
```

---

## 📱 User Interface Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                       │
│                                                          │
│  [Create Recurring Training]                            │
│                                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ Training Name: "Montag 17:00-18:30"          │      │
│  │ Day: Monday    Time: 17:00 - 18:30           │      │
│  │                                               │      │
│  │ Groups:                                       │      │
│  │ ┌─────────────────────────────────────────┐ │      │
│  │ │ 1. Anfänger         [Edit] [Delete]     │ │      │
│  │ │    Athletes: 5      Trainers: 1         │ │      │
│  │ ├─────────────────────────────────────────┤ │      │
│  │ │ 2. Fortgeschrittene [Edit] [Delete]     │ │      │
│  │ │    Athletes: 3      Trainers: 2         │ │      │
│  │ ├─────────────────────────────────────────┤ │      │
│  │ │ 3. Wettkampf       [Edit] [Delete]      │ │      │
│  │ │    Athletes: 2      Trainers: 1         │ │      │
│  │ └─────────────────────────────────────────┘ │      │
│  │                                               │      │
│  │ [+ Add Group]                                │      │
│  └──────────────────────────────────────────────┘      │
│                                                          │
│  [Generate Sessions (12 weeks)]                         │
└─────────────────────────────────────────────────────────┘

                           ↓

┌─────────────────────────────────────────────────────────┐
│                   TRAINER SESSION VIEW                   │
│                   Monday, October 27, 2025               │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ GROUP: Anfänger                   17:00 - 18:30   │ │
│  │                                                    │ │
│  │ Exercises: [Show Last Week ↻]                     │ │
│  │ ┌────────────────────────────────────────────┐   │ │
│  │ │ Rolle vorwärts (10 Wdh)                    │   │ │
│  │ │ Handstand an der Wand                      │   │ │
│  │ │ Sprünge auf dem Trampolin                  │   │ │
│  │ └────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │ Trainer: [Trainer A ▼]                            │ │
│  │                                                    │ │
│  │ Athletes:                                          │ │
│  │ ┌────────────────────────────────────────────┐   │ │
│  │ │ Anna (2017)    [✓] [!] [✗]  ✓ Present     │   │ │
│  │ │ Ben (2016)     [✓] [!] [✗]  ✓ Present     │   │ │
│  │ │ Clara (2015)   [✓] [!] [✗]  ✗ Absent      │   │ │
│  │ │   Reason: "Krankheit"                      │   │ │
│  │ └────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  [Drag athletes between groups to reassign ↔]           │
│                                                          │
│  [Save All Changes]                                     │
└─────────────────────────────────────────────────────────┘

                           ↓

┌─────────────────────────────────────────────────────────┐
│                   ATHLETE SCHEDULE                       │
│                   Anna's View                            │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Monday, October 27                                 │ │
│  │ 17:00 - 18:30                                      │ │
│  │ Group: Anfänger                                    │ │
│  │                                                     │ │
│  │ Exercises:                                          │ │
│  │ • Rolle vorwärts (10 Wdh)                          │ │
│  │ • Handstand an der Wand                            │ │
│  │ • Sprünge auf dem Trampolin                        │ │
│  │                                                     │ │
│  │ Status: ✓ Confirmed    [Cancel Session]            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Age Group: E-Jugend (2017/2016)                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Validation Rules Diagram

```
ATHLETE ASSIGNMENT VALIDATION:

Input: Assign athlete to TrainingGroup
  │
  ├─→ Is athlete already in a group for this training session?
  │   ├─ YES → ❌ REJECT (Cannot be in 2 groups same session)
  │   └─ NO  → Continue
  │
  ├─→ Does this create time overlap with another assignment?
  │   ├─ YES → ⚠️ WARN (Different sessions, same time)
  │   └─ NO  → Continue
  │
  └─→ ✅ ACCEPT

Examples:
  ✅ Anna in "Anfänger" (Mon 17:00) + "Fortgeschrittene" (Thu 18:00)
  ❌ Anna in "Anfänger" (Mon 17:00) + "Wettkampf" (Mon 17:00)
  ⚠️ Anna in "Anfänger" (Mon 17:00) + "Other Training" (Mon 17:00)
     (Different trainings but overlapping - warning only)
```

---

## 📈 System Flow Timeline

```
TIME │ ACTION                              │ WHO
─────┼─────────────────────────────────────┼──────────
Jan  │ Create recurring training           │ Admin
     │ Add groups: Anfänger, Fortgeschr.   │
     │ Assign athletes to groups           │
     │ Assign trainers to groups           │
     │ Generate sessions (12 weeks)        │
─────┼─────────────────────────────────────┼──────────
Week │ View session for this week          │ Trainer
1    │ Enter exercises for each group      │
     │ Mark attendance                     │
     │ (Ben absent, drag to other group?)  │
─────┼─────────────────────────────────────┼──────────
Week │ View session                        │ Trainer
2    │ Click "Show Last Week" for exercises│
     │ Edit/update exercises               │
     │ Mark attendance                     │
─────┼─────────────────────────────────────┼──────────
Week │ [Same pattern repeats]              │ Trainer
3-12 │                                     │
─────┼─────────────────────────────────────┼──────────
     │ View schedule & exercises           │ Athlete
     │ Confirm/cancel sessions             │ (ongoing)
─────┼─────────────────────────────────────┼──────────
Feb  │ Athlete improves → Admin moves      │ Admin
     │ them to "Fortgeschrittene" group    │
     │ (All future sessions updated)       │
─────┴─────────────────────────────────────┴──────────
```

---

This visual reference should help understand how all the pieces fit together!
