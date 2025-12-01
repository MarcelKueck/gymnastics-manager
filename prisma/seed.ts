import { PrismaClient, DayOfWeek, YouthCategory, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for production...');

  // Clean up existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning up existing data...');
  await prisma.competitionRegistration.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.absenceAlert.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.trainerCancellation.deleteMany();
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
      absenceAlertThreshold: 3,
      absenceAlertWindowDays: 30,
      absenceAlertCooldownDays: 14,
      adminNotificationEmail: 'vroni@raumonline.de',
      absenceAlertEnabled: true,
    },
  });

  // Hash password (same for all users - should be changed after first login)
  const hashedPassword = await bcrypt.hash('Turnen2024!', 10);

  // ============================================================================
  // PRIMARY ADMIN: Veronika Raum (Admin + Trainer + Athlete)
  // ============================================================================
  console.log('👤 Creating primary admin: Veronika Raum...');
  const veronika = await prisma.user.create({
    data: {
      email: 'vroni@raumonline.de',
      passwordHash: hashedPassword,
      firstName: 'Veronika',
      lastName: 'Raum',
      phone: '+49 170 1234567',
      birthDate: new Date('1985-06-15'),
      gender: Gender.FEMALE,
      isAthlete: true,
      isTrainer: true,
    },
  });

  const veronikaTrainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: veronika.id,
      role: 'ADMIN',
    },
  });

  const veronikaAthleteProfile = await prisma.athleteProfile.create({
    data: {
      userId: veronika.id,
      youthCategory: YouthCategory.D,
      status: 'ACTIVE',
      isApproved: true,
      approvedBy: veronikaTrainerProfile.id,
      approvedAt: new Date(),
      hasDtbId: true,
      competitionParticipation: true,
    },
  });

  // ============================================================================
  // TEST TRAINER: Sarah Schulz
  // ============================================================================
  console.log('👤 Creating test trainer: Sarah Schulz...');
  const sarah = await prisma.user.create({
    data: {
      email: 'sarah.schulz@example.com',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Schulz',
      phone: '+49 171 2345678',
      birthDate: new Date('1992-03-20'),
      gender: Gender.FEMALE,
      isAthlete: false,
      isTrainer: true,
    },
  });

  const sarahTrainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: sarah.id,
      role: 'TRAINER',
    },
  });

  // ============================================================================
  // TEST DUAL-ROLE: Tim Berger (Trainer + Athlete)
  // ============================================================================
  console.log('👤 Creating dual-role user: Tim Berger...');
  const tim = await prisma.user.create({
    data: {
      email: 'tim.berger@example.com',
      passwordHash: hashedPassword,
      firstName: 'Tim',
      lastName: 'Berger',
      phone: '+49 172 3456789',
      birthDate: new Date('1998-08-10'),
      gender: Gender.MALE,
      isAthlete: true,
      isTrainer: true,
    },
  });

  const timTrainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: tim.id,
      role: 'TRAINER',
    },
  });

  await prisma.athleteProfile.create({
    data: {
      userId: tim.id,
      youthCategory: YouthCategory.D,
      status: 'ACTIVE',
      isApproved: true,
      approvedBy: veronikaTrainerProfile.id,
      approvedAt: new Date(),
      hasDtbId: true,
      competitionParticipation: true,
    },
  });

  // ============================================================================
  // TEST ATHLETES
  // ============================================================================
  console.log('👤 Creating test athletes...');
  const athleteData = [
    { 
      email: 'lena.mueller@example.com', 
      firstName: 'Lena', 
      lastName: 'Müller', 
      birthDate: new Date('2014-05-20'), 
      gender: Gender.FEMALE,
      category: YouthCategory.E,
      hasDtbId: true,
      competition: true,
    },
    { 
      email: 'marie.schmidt@example.com', 
      firstName: 'Marie', 
      lastName: 'Schmidt', 
      birthDate: new Date('2015-08-10'), 
      gender: Gender.FEMALE,
      category: YouthCategory.F,
      hasDtbId: false,
      competition: false,
    },
    { 
      email: 'laura.weber@example.com', 
      firstName: 'Laura', 
      lastName: 'Weber', 
      birthDate: new Date('2013-02-28'), 
      gender: Gender.FEMALE,
      category: YouthCategory.D,
      hasDtbId: true,
      competition: true,
    },
    { 
      email: 'anna.fischer@example.com', 
      firstName: 'Anna', 
      lastName: 'Fischer', 
      birthDate: new Date('2016-11-15'), 
      gender: Gender.FEMALE,
      category: YouthCategory.F,
      hasDtbId: false,
      competition: false,
    },
    { 
      email: 'emily.meyer@example.com', 
      firstName: 'Emily', 
      lastName: 'Meyer', 
      birthDate: new Date('2014-07-03'), 
      gender: Gender.FEMALE,
      category: YouthCategory.E,
      hasDtbId: true,
      competition: true,
    },
    { 
      email: 'sophie.wagner@example.com', 
      firstName: 'Sophie', 
      lastName: 'Wagner', 
      birthDate: new Date('2015-04-22'), 
      gender: Gender.FEMALE,
      category: YouthCategory.F,
      hasDtbId: false,
      competition: false,
    },
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
        gender: data.gender,
        isAthlete: true,
        isTrainer: false,
      },
    });

    const athleteProfile = await prisma.athleteProfile.create({
      data: {
        userId: user.id,
        youthCategory: data.category,
        status: 'ACTIVE',
        isApproved: true,
        approvedBy: veronikaTrainerProfile.id,
        approvedAt: new Date(),
        hasDtbId: data.hasDtbId,
        competitionParticipation: data.competition,
      },
    });

    athletes.push({ id: athleteProfile.id, category: data.category });
  }

  // Create a pending (unapproved) athlete for testing approval flow
  console.log('👤 Creating pending athlete...');
  const pendingUser = await prisma.user.create({
    data: {
      email: 'julia.neu@example.com',
      passwordHash: hashedPassword,
      firstName: 'Julia',
      lastName: 'Neu',
      phone: '+49 175 9876543',
      birthDate: new Date('2014-09-10'),
      gender: Gender.FEMALE,
      isAthlete: true,
      isTrainer: false,
    },
  });

  await prisma.athleteProfile.create({
    data: {
      userId: pendingUser.id,
      youthCategory: YouthCategory.E,
      status: 'PENDING',
      guardianName: 'Markus Neu',
      guardianEmail: 'markus.neu@example.com',
      guardianPhone: '+49 175 1234567',
    },
  });

  // ============================================================================
  // RECURRING TRAININGS
  // ============================================================================
  console.log('🏋️ Creating recurring trainings...');
  
  const mondayTraining = await prisma.recurringTraining.create({
    data: {
      name: 'Anfänger Training',
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '16:00',
      endTime: '17:30',
      isActive: true,
      createdBy: veronikaTrainerProfile.id,
    },
  });

  const wednesdayTraining = await prisma.recurringTraining.create({
    data: {
      name: 'Fortgeschrittene',
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '17:00',
      endTime: '19:00',
      isActive: true,
      createdBy: veronikaTrainerProfile.id,
    },
  });

  const fridayTraining = await prisma.recurringTraining.create({
    data: {
      name: 'Wettkampftraining',
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '16:30',
      endTime: '18:30',
      isActive: true,
      createdBy: veronikaTrainerProfile.id,
    },
  });

  // ============================================================================
  // TRAINING GROUPS
  // ============================================================================
  console.log('👥 Creating training groups...');
  
  const anfaengerGroup = await prisma.trainingGroup.create({
    data: {
      name: 'F-Jugend',
      recurringTrainingId: mondayTraining.id,
    },
  });

  const fortgeschritteneGroup = await prisma.trainingGroup.create({
    data: {
      name: 'D/E-Jugend',
      recurringTrainingId: wednesdayTraining.id,
    },
  });

  const wettkampfGroup = await prisma.trainingGroup.create({
    data: {
      name: 'Wettkampf',
      recurringTrainingId: fridayTraining.id,
    },
  });

  // ============================================================================
  // ASSIGN ATHLETES TO GROUPS
  // ============================================================================
  console.log('📝 Assigning athletes to groups...');
  
  for (const athlete of athletes) {
    if (athlete.category === YouthCategory.F) {
      await prisma.recurringTrainingAthleteAssignment.create({
        data: {
          athleteId: athlete.id,
          trainingGroupId: anfaengerGroup.id,
          assignedBy: veronikaTrainerProfile.id,
        },
      });
    } else if (athlete.category === YouthCategory.D || athlete.category === YouthCategory.E) {
      await prisma.recurringTrainingAthleteAssignment.create({
        data: {
          athleteId: athlete.id,
          trainingGroupId: fortgeschritteneGroup.id,
          assignedBy: veronikaTrainerProfile.id,
        },
      });
    }
  }

  // Assign competition athletes to wettkampf group
  const competitionAthletes = athletes.filter((_, i) => athleteData[i].competition);
  for (const athlete of competitionAthletes) {
    await prisma.recurringTrainingAthleteAssignment.create({
      data: {
        athleteId: athlete.id,
        trainingGroupId: wettkampfGroup.id,
        assignedBy: veronikaTrainerProfile.id,
      },
    });
  }

  // Also add Veronika to wettkampf group
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      athleteId: veronikaAthleteProfile.id,
      trainingGroupId: wettkampfGroup.id,
      assignedBy: veronikaTrainerProfile.id,
    },
  });

  // ============================================================================
  // ASSIGN TRAINERS TO GROUPS
  // ============================================================================
  console.log('📝 Assigning trainers to groups...');
  
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainerId: sarahTrainerProfile.id,
      trainingGroupId: anfaengerGroup.id,
      isPrimary: true,
      assignedBy: veronikaTrainerProfile.id,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainerId: timTrainerProfile.id,
      trainingGroupId: fortgeschritteneGroup.id,
      isPrimary: true,
      assignedBy: veronikaTrainerProfile.id,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainerId: veronikaTrainerProfile.id,
      trainingGroupId: wettkampfGroup.id,
      isPrimary: true,
      assignedBy: veronikaTrainerProfile.id,
    },
  });

  // ============================================================================
  // CREATE PAST SESSIONS WITH ATTENDANCE (for history)
  // ============================================================================
  console.log('📅 Creating past sessions with attendance...');
  
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
  
  // Track which athletes should have high absences for testing the warning feature
  // First athlete (Lena) will have many unexcused absences
  const firstAthleteId = athletes[0]?.id;
  
  for (const session of createdSessions) {
    for (const group of session.recurringTraining?.trainingGroups || []) {
      for (const assignment of group.athleteAssignments) {
        let status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
        
        // Make the first athlete (Lena) have mostly unexcused absences for testing
        if (assignment.athleteId === firstAthleteId) {
          // 70% chance of unexcused absence for this athlete
          const rand = Math.random();
          if (rand < 0.70) {
            status = 'ABSENT_UNEXCUSED';
          } else {
            status = 'PRESENT';
          }
        } else {
          // Normal distribution for other athletes (85% present, 10% excused, 5% absent)
          const rand = Math.random();
          if (rand < 0.85) {
            status = 'PRESENT';
          } else if (rand < 0.95) {
            status = 'ABSENT_EXCUSED';
          } else {
            status = 'ABSENT_UNEXCUSED';
          }
        }

        await prisma.attendanceRecord.create({
          data: {
            athleteId: assignment.athleteId,
            trainingSessionId: session.id,
            status,
            markedBy: veronikaTrainerProfile.id,
          },
        });
      }
    }
  }

  // ============================================================================
  // CREATE SAMPLE COMPETITION
  // ============================================================================
  console.log('🏆 Creating sample competition...');
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(15);
  
  const competition = await prisma.competition.create({
    data: {
      name: 'Kreismeisterschaft 2024',
      date: nextMonth,
      location: 'Sporthalle Esting',
      description: 'Jährliche Kreismeisterschaft im Geräteturnen',
      minYouthCategory: YouthCategory.E,
      maxYouthCategory: YouthCategory.D,
      registrationDeadline: new Date(nextMonth.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks before
      maxParticipants: 20,
      requiresDtbId: true,
      entryFee: 15.00,
      isPublished: true,
      createdBy: veronikaTrainerProfile.id,
    },
  });

  // Register some athletes for the competition
  const eligibleAthletes = athletes.filter((_, i) => 
    athleteData[i].hasDtbId && 
    (athleteData[i].category === YouthCategory.D || athleteData[i].category === YouthCategory.E)
  );
  
  for (const athlete of eligibleAthletes) {
    await prisma.competitionRegistration.create({
      data: {
        competitionId: competition.id,
        athleteId: athlete.id,
      },
    });
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('');
  console.log('✨ Seed completed successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📧 User Accounts (Password for all: Turnen2024!)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔑 PRIMARY ADMIN (Admin + Trainer + Athlete):');
  console.log('   vroni@raumonline.de (Veronika Raum)');
  console.log('');
  console.log('👩‍🏫 TRAINERS:');
  console.log('   sarah.schulz@example.com (Sarah Schulz - Trainer only)');
  console.log('   tim.berger@example.com (Tim Berger - Trainer + Athlete)');
  console.log('');
  console.log('🏃 ATHLETES:');
  console.log('   lena.mueller@example.com (Lena Müller - E-Jugend, DTB-ID)');
  console.log('   marie.schmidt@example.com (Marie Schmidt - F-Jugend)');
  console.log('   laura.weber@example.com (Laura Weber - D-Jugend, DTB-ID)');
  console.log('   anna.fischer@example.com (Anna Fischer - F-Jugend)');
  console.log('   emily.meyer@example.com (Emily Meyer - E-Jugend, DTB-ID)');
  console.log('   sophie.wagner@example.com (Sophie Wagner - F-Jugend)');
  console.log('');
  console.log('⏳ PENDING (for testing approval):');
  console.log('   julia.neu@example.com (Julia Neu - awaiting approval)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
