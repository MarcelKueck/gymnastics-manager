import { PrismaClient, UserRole, DayOfWeek, RecurrenceInterval, YouthCategory, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed with new unified User model...');

  // Create or get system settings
  const settings = await prisma.systemSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      cancellationDeadlineHours: 2,
      absenceAlertThreshold: 3,
      absenceAlertWindowDays: 30,
      absenceAlertCooldownDays: 14,
      adminNotificationEmail: 'admin@svesting.de',
      absenceAlertEnabled: true,
      maxUploadSizeMB: 10,
      sessionGenerationDaysAhead: 90,
    },
  });
  console.log('✓ Created system settings');

  // Create admin user with BOTH profiles (trainer + athlete)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@svesting.de' },
    update: {},
    create: {
      email: 'admin@svesting.de',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+49 123 456789',
      birthDate: new Date('1990-01-01'),
      gender: Gender.OTHER,
      isAthlete: true, // All trainers have athlete profiles
      isTrainer: true,
      athleteProfile: {
        create: {
          youthCategory: YouthCategory.F,
          competitionParticipation: false,
          hasDtbId: false,
          isApproved: true,
          approvedAt: new Date(),
          configuredAt: new Date(),
          autoConfirmFutureSessions: false,
        },
      },
      trainerProfile: {
        create: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      },
    },
  });
  console.log('✓ Created admin user (with both profiles):', admin.email);

  // Get the admin's trainer profile ID for later use
  const adminTrainerProfile = await prisma.trainerProfile.findUnique({
    where: { userId: admin.id },
  });

  // Create sample trainer 1 with BOTH profiles
  const trainerPassword = await bcrypt.hash('trainer123', 10);
  const trainer1User = await prisma.user.upsert({
    where: { email: 'trainer@svesting.de' },
    update: {},
    create: {
      email: 'trainer@svesting.de',
      passwordHash: trainerPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+49 987 654321',
      birthDate: new Date('1995-06-15'),
      gender: Gender.MALE,
      isAthlete: true, // All trainers have athlete profiles
      isTrainer: true,
      athleteProfile: {
        create: {
          youthCategory: YouthCategory.F,
          competitionParticipation: false,
          hasDtbId: false,
          isApproved: true,
          approvedBy: adminTrainerProfile?.id,
          approvedAt: new Date(),
          configuredAt: new Date(),
          autoConfirmFutureSessions: false,
        },
      },
      trainerProfile: {
        create: {
          role: UserRole.TRAINER,
          isActive: true,
        },
      },
    },
  });
  console.log('✓ Created trainer 1 (with both profiles):', trainer1User.email);

  const trainer1Profile = await prisma.trainerProfile.findUnique({
    where: { userId: trainer1User.id },
  });

  // Create sample trainer 2 with BOTH profiles
  const trainer2User = await prisma.user.upsert({
    where: { email: 'sarah.trainer@svesting.de' },
    update: {},
    create: {
      email: 'sarah.trainer@svesting.de',
      passwordHash: trainerPassword,
      firstName: 'Sarah',
      lastName: 'Schmidt',
      phone: '+49 987 654322',
      birthDate: new Date('1993-03-20'),
      gender: Gender.FEMALE,
      isAthlete: true, // All trainers have athlete profiles
      isTrainer: true,
      athleteProfile: {
        create: {
          youthCategory: YouthCategory.F,
          competitionParticipation: false,
          hasDtbId: false,
          isApproved: true,
          approvedBy: adminTrainerProfile?.id,
          approvedAt: new Date(),
          configuredAt: new Date(),
          autoConfirmFutureSessions: false,
        },
      },
      trainerProfile: {
        create: {
          role: UserRole.TRAINER,
          isActive: true,
        },
      },
    },
  });
  console.log('✓ Created trainer 2 (with both profiles):', trainer2User.email);

  const trainer2Profile = await prisma.trainerProfile.findUnique({
    where: { userId: trainer2User.id },
  });

  // Create sample recurring trainings
  let mondayTraining = await prisma.recurringTraining.findFirst({
    where: {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '17:00',
    },
  });

  if (!mondayTraining && adminTrainerProfile) {
    mondayTraining = await prisma.recurringTraining.create({
      data: {
        name: 'Montag - Jugendtraining',
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '17:00',
        endTime: '18:30',
        recurrence: RecurrenceInterval.WEEKLY,
        isActive: true,
        createdBy: adminTrainerProfile.id,
      },
    });
  }
  console.log('✓ Created Monday training:', mondayTraining?.name);

  let wednesdayTraining = await prisma.recurringTraining.findFirst({
    where: {
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '16:00',
    },
  });

  if (!wednesdayTraining && adminTrainerProfile) {
    wednesdayTraining = await prisma.recurringTraining.create({
      data: {
        name: 'Mittwoch - Anfänger',
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '16:00',
        endTime: '17:30',
        recurrence: RecurrenceInterval.WEEKLY,
        isActive: true,
        createdBy: adminTrainerProfile.id,
      },
    });
  }
  console.log('✓ Created Wednesday training:', wednesdayTraining?.name);

  let fridayTraining = await prisma.recurringTraining.findFirst({
    where: {
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '18:00',
    },
  });

  if (!fridayTraining && adminTrainerProfile) {
    fridayTraining = await prisma.recurringTraining.create({
      data: {
        name: 'Freitag - Wettkampfgruppe',
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: '18:00',
        endTime: '19:30',
        recurrence: RecurrenceInterval.WEEKLY,
        isActive: true,
        createdBy: adminTrainerProfile.id,
      },
    });
  }
  console.log('✓ Created Friday training:', fridayTraining?.name);

  // Create training groups for Monday
  const beginnerGroup = mondayTraining ? await prisma.trainingGroup.upsert({
    where: {
      recurringTrainingId_name: {
        recurringTrainingId: mondayTraining.id,
        name: 'Anfänger',
      },
    },
    update: {},
    create: {
      name: 'Anfänger',
      recurringTrainingId: mondayTraining.id,
      sortOrder: 0,
    },
  }) : null;

  const advancedGroup = mondayTraining ? await prisma.trainingGroup.upsert({
    where: {
      recurringTrainingId_name: {
        recurringTrainingId: mondayTraining.id,
        name: 'Fortgeschrittene',
      },
    },
    update: {},
    create: {
      name: 'Fortgeschrittene',
      recurringTrainingId: mondayTraining.id,
      sortOrder: 1,
    },
  }) : null;

  // Create group for Wednesday
  const wednesdayGroup = wednesdayTraining ? await prisma.trainingGroup.upsert({
    where: {
      recurringTrainingId_name: {
        recurringTrainingId: wednesdayTraining.id,
        name: 'Gruppe A',
      },
    },
    update: {},
    create: {
      name: 'Gruppe A',
      recurringTrainingId: wednesdayTraining.id,
      sortOrder: 0,
    },
  }) : null;

  // Create group for Friday
  const fridayGroup = fridayTraining ? await prisma.trainingGroup.upsert({
    where: {
      recurringTrainingId_name: {
        recurringTrainingId: fridayTraining.id,
        name: 'Wettkampf',
      },
    },
    update: {},
    create: {
      name: 'Wettkampf',
      recurringTrainingId: fridayTraining.id,
      sortOrder: 0,
    },
  }) : null;
  console.log('✓ Created training groups');

  // Assign trainers to groups
  if (beginnerGroup && trainer1Profile && adminTrainerProfile) {
    await prisma.recurringTrainingTrainerAssignment.upsert({
      where: {
        trainingGroupId_trainerId: {
          trainingGroupId: beginnerGroup.id,
          trainerId: trainer1Profile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: beginnerGroup.id,
        trainerId: trainer1Profile.id,
        assignedBy: adminTrainerProfile.id,
        isPrimary: true,
      },
    });
  }

  if (advancedGroup && trainer2Profile && adminTrainerProfile) {
    await prisma.recurringTrainingTrainerAssignment.upsert({
      where: {
        trainingGroupId_trainerId: {
          trainingGroupId: advancedGroup.id,
          trainerId: trainer2Profile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: advancedGroup.id,
        trainerId: trainer2Profile.id,
        assignedBy: adminTrainerProfile.id,
        isPrimary: true,
      },
    });
  }

  if (wednesdayGroup && trainer1Profile && adminTrainerProfile) {
    await prisma.recurringTrainingTrainerAssignment.upsert({
      where: {
        trainingGroupId_trainerId: {
          trainingGroupId: wednesdayGroup.id,
          trainerId: trainer1Profile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: wednesdayGroup.id,
        trainerId: trainer1Profile.id,
        assignedBy: adminTrainerProfile.id,
        isPrimary: true,
      },
    });
  }

  if (fridayGroup && trainer2Profile && adminTrainerProfile) {
    await prisma.recurringTrainingTrainerAssignment.upsert({
      where: {
        trainingGroupId_trainerId: {
          trainingGroupId: fridayGroup.id,
          trainerId: trainer2Profile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: fridayGroup.id,
        trainerId: trainer2Profile.id,
        assignedBy: adminTrainerProfile.id,
        isPrimary: true,
      },
    });
  }
  console.log('✓ Assigned trainers to groups');

  // Get the admin's and trainers' athlete profiles
  const adminAthleteProfile = await prisma.athleteProfile.findUnique({
    where: { userId: admin.id },
  });
  const trainer1AthleteProfile = await prisma.athleteProfile.findUnique({
    where: { userId: trainer1User.id },
  });
  const trainer2AthleteProfile = await prisma.athleteProfile.findUnique({
    where: { userId: trainer2User.id },
  });

  // Assign trainers as ATHLETES to groups they DON'T teach (testing dual-role)
  // Trainer 1 teaches beginnerGroup and wednesdayGroup, so add them as athlete to advancedGroup & fridayGroup
  if (advancedGroup && trainer1AthleteProfile && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: advancedGroup.id,
          athleteId: trainer1AthleteProfile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: advancedGroup.id,
        athleteId: trainer1AthleteProfile.id,
        assignedBy: adminTrainerProfile.id,
      },
    });
    console.log('✓ Added trainer 1 as athlete to advanced group (dual-role test)');
  }

  if (fridayGroup && trainer1AthleteProfile && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: fridayGroup.id,
          athleteId: trainer1AthleteProfile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: fridayGroup.id,
        athleteId: trainer1AthleteProfile.id,
        assignedBy: adminTrainerProfile.id,
      },
    });
    console.log('✓ Added trainer 1 as athlete to friday group (dual-role test)');
  }

  // Trainer 2 teaches advancedGroup and fridayGroup, so add them as athlete to beginnerGroup
  if (beginnerGroup && trainer2AthleteProfile && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: beginnerGroup.id,
          athleteId: trainer2AthleteProfile.id,
        },
      },
      update: {},
      create: {
        trainingGroupId: beginnerGroup.id,
        athleteId: trainer2AthleteProfile.id,
        assignedBy: adminTrainerProfile.id,
      },
    });
    console.log('✓ Added trainer 2 as athlete to beginner group (dual-role test)');
  }

  // Create sample athletes (athlete-only accounts)
  const athletePassword = await bcrypt.hash('athlete123', 10);
  
  const athletes = [
    {
      email: 'athlete@example.com',
      firstName: 'Anna',
      lastName: 'Beispiel',
      birthDate: new Date('2010-05-15'),
      gender: Gender.FEMALE,
      youthCategory: YouthCategory.D,
    },
    {
      email: 'lisa.mueller@example.com',
      firstName: 'Lisa',
      lastName: 'Müller',
      birthDate: new Date('2011-03-20'),
      gender: Gender.FEMALE,
      youthCategory: YouthCategory.D,
    },
    {
      email: 'tom.schmidt@example.com',
      firstName: 'Tom',
      lastName: 'Schmidt',
      birthDate: new Date('2009-08-10'),
      gender: Gender.MALE,
      youthCategory: YouthCategory.D,
    },
    {
      email: 'emma.wagner@example.com',
      firstName: 'Emma',
      lastName: 'Wagner',
      birthDate: new Date('2012-01-25'),
      gender: Gender.FEMALE,
      youthCategory: YouthCategory.E,
    },
    {
      email: 'lukas.bauer@example.com',
      firstName: 'Lukas',
      lastName: 'Bauer',
      birthDate: new Date('2010-11-30'),
      gender: Gender.MALE,
      youthCategory: YouthCategory.D,
    },
  ];

  const createdAthleteProfiles = [];
  for (const athleteData of athletes) {
    const user = await prisma.user.upsert({
      where: { email: athleteData.email },
      update: {},
      create: {
        email: athleteData.email,
        passwordHash: athletePassword,
        firstName: athleteData.firstName,
        lastName: athleteData.lastName,
        phone: '+49 111 222333',
        birthDate: athleteData.birthDate,
        gender: athleteData.gender,
        isAthlete: true,
        isTrainer: false, // Athlete-only accounts
        athleteProfile: {
          create: {
            youthCategory: athleteData.youthCategory,
            competitionParticipation: false,
            hasDtbId: false,
            isApproved: true,
            approvedBy: adminTrainerProfile?.id,
            approvedAt: new Date(),
            configuredAt: new Date(),
            autoConfirmFutureSessions: false,
          },
        },
      },
    });

    const athleteProfile = await prisma.athleteProfile.findUnique({
      where: { userId: user.id },
    });

    if (athleteProfile) {
      createdAthleteProfiles.push(athleteProfile);
    }
    console.log('✓ Created athlete (athlete-only):', user.email);
  }

  // Assign athletes to groups
  if (beginnerGroup && createdAthleteProfiles[0] && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: beginnerGroup.id,
          athleteId: createdAthleteProfiles[0].id,
        },
      },
      update: {},
      create: {
        trainingGroupId: beginnerGroup.id,
        athleteId: createdAthleteProfiles[0].id,
        assignedBy: adminTrainerProfile.id,
      },
    });
  }

  if (beginnerGroup && createdAthleteProfiles[1] && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: beginnerGroup.id,
          athleteId: createdAthleteProfiles[1].id,
        },
      },
      update: {},
      create: {
        trainingGroupId: beginnerGroup.id,
        athleteId: createdAthleteProfiles[1].id,
        assignedBy: adminTrainerProfile.id,
      },
    });
  }

  if (advancedGroup && createdAthleteProfiles[2] && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: advancedGroup.id,
          athleteId: createdAthleteProfiles[2].id,
        },
      },
      update: {},
      create: {
        trainingGroupId: advancedGroup.id,
        athleteId: createdAthleteProfiles[2].id,
        assignedBy: adminTrainerProfile.id,
      },
    });
  }

  if (wednesdayGroup && createdAthleteProfiles[3] && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: wednesdayGroup.id,
          athleteId: createdAthleteProfiles[3].id,
        },
      },
      update: {},
      create: {
        trainingGroupId: wednesdayGroup.id,
        athleteId: createdAthleteProfiles[3].id,
        assignedBy: adminTrainerProfile.id,
      },
    });
  }

  if (fridayGroup && createdAthleteProfiles[4] && adminTrainerProfile) {
    await prisma.recurringTrainingAthleteAssignment.upsert({
      where: {
        trainingGroupId_athleteId: {
          trainingGroupId: fridayGroup.id,
          athleteId: createdAthleteProfiles[4].id,
        },
      },
      update: {},
      create: {
        trainingGroupId: fridayGroup.id,
        athleteId: createdAthleteProfiles[4].id,
        assignedBy: adminTrainerProfile.id,
      },
    });
  }
  console.log('✓ Assigned athletes to groups');

  // Create file upload categories
  const categories = [
    { name: 'Trainingspläne', description: 'Wöchentliche Trainingspläne', sortOrder: 0 },
    { name: 'Wettkampfpläne', description: 'Pläne für Wettkämpfe', sortOrder: 1 },
    { name: 'Allgemein', description: 'Allgemeine Dokumente', sortOrder: 2 },
  ];

  for (const category of categories) {
    await prisma.uploadCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log('✓ Created upload categories');

  console.log('\n✅ Seed completed successfully with new unified User model!');
  console.log('\n📝 Test credentials:');
  console.log('👤 Admin (dual-role): admin@svesting.de / admin123');
  console.log('👤 Trainer 1 (dual-role): trainer@svesting.de / trainer123');
  console.log('👤 Trainer 2 (dual-role): sarah.trainer@svesting.de / trainer123');
  console.log('👤 Athletes (athlete-only): athlete@example.com, lisa.mueller@example.com, etc. / athlete123');
  console.log('\n💡 All trainers have BOTH athlete and trainer profiles.');
  console.log('💡 All regular athletes have ONLY athlete profiles.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
