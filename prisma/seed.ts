import { PrismaClient, UserRole, DayOfWeek, RecurrenceInterval, YouthCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

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
  console.log('Created system settings');

  // Create admin trainer
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.trainer.upsert({
    where: { email: 'admin@svesting.de' },
    update: {},
    create: {
      email: 'admin@svesting.de',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+49 123 456789',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create sample trainers
  const trainerPassword = await bcrypt.hash('trainer123', 10);
  const trainer1 = await prisma.trainer.upsert({
    where: { email: 'trainer@svesting.de' },
    update: {},
    create: {
      email: 'trainer@svesting.de',
      passwordHash: trainerPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      phone: '+49 987 654321',
      role: UserRole.TRAINER,
      isActive: true,
    },
  });
  console.log('Created trainer user:', trainer1.email);

  const trainer2 = await prisma.trainer.upsert({
    where: { email: 'sarah.trainer@svesting.de' },
    update: {},
    create: {
      email: 'sarah.trainer@svesting.de',
      passwordHash: trainerPassword,
      firstName: 'Sarah',
      lastName: 'Schmidt',
      phone: '+49 987 654322',
      role: UserRole.TRAINER,
      isActive: true,
    },
  });
  console.log('Created second trainer:', trainer2.email);

  // Create sample recurring trainings
  let mondayTraining = await prisma.recurringTraining.findFirst({
    where: {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '17:00',
    },
  });

  if (!mondayTraining) {
    mondayTraining = await prisma.recurringTraining.create({
      data: {
        name: 'Montag - Jugendtraining',
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '17:00',
        endTime: '18:30',
        recurrence: RecurrenceInterval.WEEKLY,
        isActive: true,
        createdBy: admin.id,
      },
    });
  }
  console.log('Created Monday training:', mondayTraining.name);

  let wednesdayTraining = await prisma.recurringTraining.findFirst({
    where: {
      dayOfWeek: DayOfWeek.WEDNESDAY,
      startTime: '16:00',
    },
  });

  if (!wednesdayTraining) {
    wednesdayTraining = await prisma.recurringTraining.create({
      data: {
        name: 'Mittwoch - Anfänger',
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '16:00',
        endTime: '17:30',
        recurrence: RecurrenceInterval.WEEKLY,
        isActive: true,
        createdBy: admin.id,
      },
    });
  }
  console.log('Created Wednesday training:', wednesdayTraining.name);

  let fridayTraining = await prisma.recurringTraining.findFirst({
    where: {
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '18:00',
    },
  });

  if (!fridayTraining) {
    fridayTraining = await prisma.recurringTraining.create({
      data: {
        name: 'Freitag - Wettkampfgruppe',
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: '18:00',
        endTime: '19:30',
        recurrence: RecurrenceInterval.WEEKLY,
        isActive: true,
        createdBy: admin.id,
      },
    });
  }
  console.log('Created Friday training:', fridayTraining.name);

  // Create training groups for Monday
  const beginnerGroup = await prisma.trainingGroup.upsert({
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
  });

  const advancedGroup = await prisma.trainingGroup.upsert({
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
  });

  // Create group for Wednesday
  const wednesdayGroup = await prisma.trainingGroup.upsert({
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
  });

  // Create group for Friday
  const fridayGroup = await prisma.trainingGroup.upsert({
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
  });
  console.log('Created training groups');

  // Assign trainers to groups
  await prisma.recurringTrainingTrainerAssignment.upsert({
    where: {
      trainingGroupId_trainerId: {
        trainingGroupId: beginnerGroup.id,
        trainerId: trainer1.id,
      },
    },
    update: {},
    create: {
      trainingGroupId: beginnerGroup.id,
      trainerId: trainer1.id,
      assignedBy: admin.id,
      isPrimary: true,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.upsert({
    where: {
      trainingGroupId_trainerId: {
        trainingGroupId: advancedGroup.id,
        trainerId: trainer2.id,
      },
    },
    update: {},
    create: {
      trainingGroupId: advancedGroup.id,
      trainerId: trainer2.id,
      assignedBy: admin.id,
      isPrimary: true,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.upsert({
    where: {
      trainingGroupId_trainerId: {
        trainingGroupId: wednesdayGroup.id,
        trainerId: trainer1.id,
      },
    },
    update: {},
    create: {
      trainingGroupId: wednesdayGroup.id,
      trainerId: trainer1.id,
      assignedBy: admin.id,
      isPrimary: true,
    },
  });

  await prisma.recurringTrainingTrainerAssignment.upsert({
    where: {
      trainingGroupId_trainerId: {
        trainingGroupId: fridayGroup.id,
        trainerId: trainer2.id,
      },
    },
    update: {},
    create: {
      trainingGroupId: fridayGroup.id,
      trainerId: trainer2.id,
      assignedBy: admin.id,
      isPrimary: true,
    },
  });
  console.log('Assigned trainers to groups');

  // Create sample athletes
  const athletePassword = await bcrypt.hash('athlete123', 10);
  
  const athletes = [
    {
      email: 'athlete@example.com',
      firstName: 'Anna',
      lastName: 'Beispiel',
      birthDate: new Date('2010-05-15'),
      gender: 'FEMALE' as const,
      youthCategory: YouthCategory.D,
    },
    {
      email: 'lisa.mueller@example.com',
      firstName: 'Lisa',
      lastName: 'Müller',
      birthDate: new Date('2011-03-20'),
      gender: 'FEMALE' as const,
      youthCategory: YouthCategory.D,
    },
    {
      email: 'tom.schmidt@example.com',
      firstName: 'Tom',
      lastName: 'Schmidt',
      birthDate: new Date('2009-08-10'),
      gender: 'MALE' as const,
      youthCategory: YouthCategory.D,
    },
    {
      email: 'emma.wagner@example.com',
      firstName: 'Emma',
      lastName: 'Wagner',
      birthDate: new Date('2012-01-25'),
      gender: 'FEMALE' as const,
      youthCategory: YouthCategory.E,
    },
    {
      email: 'lukas.bauer@example.com',
      firstName: 'Lukas',
      lastName: 'Bauer',
      birthDate: new Date('2010-11-30'),
      gender: 'MALE' as const,
      youthCategory: YouthCategory.D,
    },
  ];

  const createdAthletes = [];
  for (const athleteData of athletes) {
    const athlete = await prisma.athlete.upsert({
      where: { email: athleteData.email },
      update: {},
      create: {
        ...athleteData,
        passwordHash: athletePassword,
        phone: '+49 111 222333',
        competitionParticipation: false,
        hasDtbId: false,
        isApproved: true,
        approvedBy: admin.id,
        approvedAt: new Date(),
        configuredAt: new Date(),
      },
    });
    createdAthletes.push(athlete);
    console.log('Created athlete:', athlete.email);
  }

  // Assign athletes to groups
  await prisma.recurringTrainingAthleteAssignment.upsert({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: beginnerGroup.id,
        athleteId: createdAthletes[0].id,
      },
    },
    update: {},
    create: {
      trainingGroupId: beginnerGroup.id,
      athleteId: createdAthletes[0].id,
      assignedBy: admin.id,
    },
  });

  await prisma.recurringTrainingAthleteAssignment.upsert({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: beginnerGroup.id,
        athleteId: createdAthletes[1].id,
      },
    },
    update: {},
    create: {
      trainingGroupId: beginnerGroup.id,
      athleteId: createdAthletes[1].id,
      assignedBy: admin.id,
    },
  });

  await prisma.recurringTrainingAthleteAssignment.upsert({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: advancedGroup.id,
        athleteId: createdAthletes[2].id,
      },
    },
    update: {},
    create: {
      trainingGroupId: advancedGroup.id,
      athleteId: createdAthletes[2].id,
      assignedBy: admin.id,
    },
  });

  await prisma.recurringTrainingAthleteAssignment.upsert({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: wednesdayGroup.id,
        athleteId: createdAthletes[3].id,
      },
    },
    update: {},
    create: {
      trainingGroupId: wednesdayGroup.id,
      athleteId: createdAthletes[3].id,
      assignedBy: admin.id,
    },
  });

  await prisma.recurringTrainingAthleteAssignment.upsert({
    where: {
      trainingGroupId_athleteId: {
        trainingGroupId: fridayGroup.id,
        athleteId: createdAthletes[4].id,
      },
    },
    update: {},
    create: {
      trainingGroupId: fridayGroup.id,
      athleteId: createdAthletes[4].id,
      assignedBy: admin.id,
    },
  });
  console.log('Assigned athletes to groups');

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
  console.log('Created upload categories');

  console.log('Seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@svesting.de / admin123');
  console.log('Trainer 1: trainer@svesting.de / trainer123');
  console.log('Trainer 2: sarah.trainer@svesting.de / trainer123');
  console.log('Athletes: athlete@example.com, lisa.mueller@example.com, etc. / athlete123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });