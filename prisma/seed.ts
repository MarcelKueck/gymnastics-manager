import { PrismaClient, DayOfWeek, YouthCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning up existing data...');
  await prisma.competitionRegistration.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.absenceAlert.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.sessionAthleteAssignment.deleteMany();
  await prisma.sessionGroupTrainerAssignment.deleteMany();
  await prisma.sessionGroup.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.recurringTrainingTrainerAssignment.deleteMany();
  await prisma.recurringTrainingAthleteAssignment.deleteMany();
  await prisma.trainingGroup.deleteMany();
  await prisma.recurringTraining.deleteMany();
  await prisma.athleteProfile.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  // Create system settings
  console.log('⚙️ Creating system settings...');
  await prisma.systemSettings.create({
    data: {
      id: 'default',
      cancellationDeadlineHours: 2,
      sessionGenerationDaysAhead: 56, // 8 weeks
    },
  });

  // Hash password (same for all test users)
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin user (with all three roles: Admin, Trainer, Athlete)
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@svesting.de',
      passwordHash: hashedPassword,
      firstName: 'Anna',
      lastName: 'Admin',
      phone: '+49 170 1234567',
      birthDate: new Date('1990-01-15'),
      isAthlete: true,
      isTrainer: true,
    },
  });

  const adminTrainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: admin.id,
      role: 'ADMIN',
    },
  });

  const adminAthleteProfile = await prisma.athleteProfile.create({
    data: {
      userId: admin.id,
      youthCategory: YouthCategory.F, // Adult
      status: 'ACTIVE',
      approvedBy: adminTrainerProfile.id,
      approvedAt: new Date(),
    },
  });

  // Create additional Admin users for testing email notifications
  console.log('👤 Creating additional admin users (Marcel)...');
  const adminMarcel1 = await prisma.user.create({
    data: {
      email: 'kueck.marcel@gmail.com',
      passwordHash: hashedPassword,
      firstName: 'Marcel',
      lastName: 'Kück',
      phone: '+49 173 1111111',
      isAthlete: false,
      isTrainer: true,
    },
  });

  await prisma.trainerProfile.create({
    data: {
      userId: adminMarcel1.id,
      role: 'ADMIN',
    },
  });

  const adminMarcel2 = await prisma.user.create({
    data: {
      email: 'marcel.kueck@shareyourspace.com',
      passwordHash: hashedPassword,
      firstName: 'Marcel',
      lastName: 'Kück (SYS)',
      phone: '+49 173 2222222',
      isAthlete: false,
      isTrainer: true,
    },
  });

  await prisma.trainerProfile.create({
    data: {
      userId: adminMarcel2.id,
      role: 'ADMIN',
    },
  });

  // Create Trainer user
  console.log('👤 Creating trainer user...');
  const trainer = await prisma.user.create({
    data: {
      email: 'trainer@svesting.de',
      passwordHash: hashedPassword,
      firstName: 'Thomas',
      lastName: 'Trainer',
      phone: '+49 171 2345678',
      isAthlete: false,
      isTrainer: true,
    },
  });

  const trainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: trainer.id,
      role: 'TRAINER',
    },
  });

  // Create a dual-role user (athlete + trainer)
  console.log('👤 Creating dual-role user...');
  const dualRole = await prisma.user.create({
    data: {
      email: 'lisa@svesting.de',
      passwordHash: hashedPassword,
      firstName: 'Lisa',
      lastName: 'Leitung',
      phone: '+49 172 3456789',
      birthDate: new Date('1995-03-15'),
      isAthlete: true,
      isTrainer: true,
    },
  });

  const dualRoleTrainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: dualRole.id,
      role: 'TRAINER',
    },
  });

  await prisma.athleteProfile.create({
    data: {
      userId: dualRole.id,
      youthCategory: YouthCategory.F, // Adult, using F as placeholder
      status: 'ACTIVE',
      approvedBy: trainerProfile.id,
      approvedAt: new Date(),
    },
  });

  // Create Athletes
  console.log('👤 Creating athlete users...');
  const athleteData = [
    { email: 'max@example.com', firstName: 'Max', lastName: 'Mustermann', birthDate: new Date('2010-05-20'), category: YouthCategory.D },
    { email: 'emma@example.com', firstName: 'Emma', lastName: 'Schmidt', birthDate: new Date('2012-08-10'), category: YouthCategory.E },
    { email: 'leon@example.com', firstName: 'Leon', lastName: 'Weber', birthDate: new Date('2011-02-28'), category: YouthCategory.D },
    { email: 'mia@example.com', firstName: 'Mia', lastName: 'Fischer', birthDate: new Date('2015-11-15'), category: YouthCategory.F },
    { email: 'paul@example.com', firstName: 'Paul', lastName: 'Meyer', birthDate: new Date('2013-07-03'), category: YouthCategory.E },
    { email: 'sophie@example.com', firstName: 'Sophie', lastName: 'Wagner', birthDate: new Date('2014-04-22'), category: YouthCategory.F },
  ];

  const athletes: { id: string; category: YouthCategory }[] = [];

  for (const data of athleteData) {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: '',
        birthDate: data.birthDate,
        isAthlete: true,
        isTrainer: false,
      },
    });

    const athleteProfile = await prisma.athleteProfile.create({
      data: {
        userId: user.id,
        youthCategory: data.category,
        status: 'ACTIVE',
        approvedBy: trainerProfile.id,
        approvedAt: new Date(),
      },
    });

    athletes.push({ id: athleteProfile.id, category: data.category });
  }

  // Create a pending (unapproved) athlete
  console.log('👤 Creating pending athlete...');
  const pendingUser = await prisma.user.create({
    data: {
      email: 'pending@example.com',
      passwordHash: hashedPassword,
      firstName: 'Peter',
      lastName: 'Pending',
      phone: '',
      birthDate: new Date('2011-09-10'),
      isAthlete: true,
      isTrainer: false,
    },
  });

  await prisma.athleteProfile.create({
    data: {
      userId: pendingUser.id,
      youthCategory: YouthCategory.D,
      status: 'PENDING',
    },
  });

  // Create Recurring Trainings
  console.log('🏋️ Creating recurring trainings...');
  const mondayTraining = await prisma.recurringTraining.create({
    data: {
      name: 'Anfänger Training',
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '16:00',
      endTime: '17:30',
      isActive: true,
      createdBy: trainerProfile.id,
    },
  });

  const wednesdayTraining = await prisma.recurringTraining.create({
    data: {
      name: 'Fortgeschrittene',
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '17:00',
      endTime: '19:00',
      isActive: true,
      createdBy: trainerProfile.id,
    },
  });

  const fridayTraining = await prisma.recurringTraining.create({
    data: {
      name: 'Wettkampftraining',
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '16:30',
      endTime: '18:30',
      isActive: true,
      createdBy: trainerProfile.id,
    },
  });

  // Create Training Groups
  console.log('👥 Creating training groups...');
  const anfaengerGroup = await prisma.trainingGroup.create({
    data: {
      name: 'Anfänger F',
      recurringTrainingId: mondayTraining.id,
    },
  });

  const fortgeschritteneGroup = await prisma.trainingGroup.create({
    data: {
      name: 'Fortgeschrittene D-E',
      recurringTrainingId: wednesdayTraining.id,
    },
  });

  const wettkampfGroup = await prisma.trainingGroup.create({
    data: {
      name: 'Wettkampf alle',
      recurringTrainingId: fridayTraining.id,
    },
  });

  // Assign athletes to groups based on category
  console.log('📝 Assigning athletes to groups...');
  for (const athlete of athletes) {
    if (athlete.category === YouthCategory.F) {
      await prisma.recurringTrainingAthleteAssignment.create({
        data: {
          athleteId: athlete.id,
          trainingGroupId: anfaengerGroup.id,
          assignedBy: trainerProfile.id,
        },
      });
    } else if (athlete.category === YouthCategory.D || athlete.category === YouthCategory.E) {
      await prisma.recurringTrainingAthleteAssignment.create({
        data: {
          athleteId: athlete.id,
          trainingGroupId: fortgeschritteneGroup.id,
          assignedBy: trainerProfile.id,
        },
      });
    }
    
    // Also assign all athletes to wettkampf group
    await prisma.recurringTrainingAthleteAssignment.create({
      data: {
        athleteId: athlete.id,
        trainingGroupId: wettkampfGroup.id,
        assignedBy: trainerProfile.id,
      },
    });
  }

  // Also assign admin athlete to wettkampf group
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      athleteId: adminAthleteProfile.id,
      trainingGroupId: wettkampfGroup.id,
      assignedBy: adminTrainerProfile.id,
    },
  });

  // Assign trainers to groups
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainerId: trainerProfile.id,
      trainingGroupId: anfaengerGroup.id,
      isPrimary: true,
      assignedBy: adminTrainerProfile.id,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainerId: trainerProfile.id,
      trainingGroupId: fortgeschritteneGroup.id,
      isPrimary: true,
      assignedBy: adminTrainerProfile.id,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainerId: dualRoleTrainerProfile.id,
      trainingGroupId: wettkampfGroup.id,
      isPrimary: true,
      assignedBy: adminTrainerProfile.id,
    },
  });

  // Helper to get number from DayOfWeek enum
  const getDayNumber = (day: DayOfWeek): number => {
    const dayMap: Record<DayOfWeek, number> = {
      [DayOfWeek.SUNDAY]: 0,
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
    };
    return dayMap[day];
  };

  // NOTE: With virtual sessions, we don't pre-generate future sessions.
  // They are calculated on-the-fly from RecurringTraining definitions.
  // We only create past sessions that have attendance data for history.

  // Create past sessions with attendance for realistic history
  console.log('📅 Creating past sessions with attendance...');
  const today = new Date();
  const sessionsToCreate: {
    recurringTrainingId: string;
    date: Date;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isCompleted: boolean;
    isCancelled: boolean;
  }[] = [];

  // Create 3 weeks of past sessions
  for (let week = 1; week <= 3; week++) {
    for (const training of [mondayTraining, wednesdayTraining, fridayTraining]) {
      const date = new Date(today);
      const currentDay = date.getDay();
      const targetDay = getDayNumber(training.dayOfWeek);
      let daysToSubtract = currentDay - targetDay;
      if (daysToSubtract <= 0) daysToSubtract += 7;
      daysToSubtract += (week - 1) * 7;
      date.setDate(date.getDate() - daysToSubtract);
      date.setHours(0, 0, 0, 0);

      sessionsToCreate.push({
        recurringTrainingId: training.id,
        date: date,
        dayOfWeek: training.dayOfWeek,
        startTime: training.startTime,
        endTime: training.endTime,
        isCompleted: true,
        isCancelled: false,
      });
    }
  }

  await prisma.trainingSession.createMany({
    data: sessionsToCreate,
  });

  // Get the created sessions to add attendance records
  const createdSessions = await prisma.trainingSession.findMany({
    where: { isCompleted: true },
    include: {
      recurringTraining: {
        include: {
          trainingGroups: {
            include: {
              athleteAssignments: true,
            },
          },
        },
      },
    },
  });

  // Add attendance records for completed sessions
  console.log('✅ Adding attendance records...');
  for (const session of createdSessions) {
    for (const group of session.recurringTraining?.trainingGroups || []) {
      for (const assignment of group.athleteAssignments) {
        // Randomly assign attendance status (80% present, 15% excused, 5% absent)
        const rand = Math.random();
        let status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
        if (rand < 0.8) {
          status = 'PRESENT';
        } else if (rand < 0.95) {
          status = 'ABSENT_EXCUSED';
        } else {
          status = 'ABSENT_UNEXCUSED';
        }

        await prisma.attendanceRecord.create({
          data: {
            athleteId: assignment.athleteId,
            trainingSessionId: session.id,
            status,
            markedBy: trainerProfile.id,
          },
        });
      }
    }
  }

  console.log('✨ Seed completed successfully!');
  console.log('');
  console.log('📧 Test accounts (all use password: password123):');
  console.log('   Admin:    admin@svesting.de');
  console.log('   Trainer:  trainer@svesting.de');
  console.log('   Dual:     lisa@svesting.de (athlete + trainer)');
  console.log('   Athletes: max@example.com, emma@example.com, leon@example.com,');
  console.log('             mia@example.com, paul@example.com, sophie@example.com');
  console.log('   Pending:  pending@example.com (not approved yet)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
