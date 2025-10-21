// Save as: prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create test trainer
  const trainerPassword = await bcrypt.hash("trainer123", 12);
  const trainer = await prisma.trainer.upsert({
    where: { email: "trainer@gym.com" },
    update: {},
    create: {
      email: "trainer@gym.com",
      passwordHash: trainerPassword,
      firstName: "Max",
      lastName: "Müller",
      phone: "+49 123 456789",
      role: "TRAINER",
      isActive: true,
    },
  });
  console.log("✅ Created test trainer:", trainer.email);
  console.log("   Password: trainer123");

  // Create admin trainer
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.trainer.upsert({
    where: { email: "admin@gym.com" },
    update: {},
    create: {
      email: "admin@gym.com",
      passwordHash: adminPassword,
      firstName: "Anna",
      lastName: "Schmidt",
      phone: "+49 123 456790",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Created admin:", admin.email);
  console.log("   Password: admin123");

  // Create second trainer for testing 2-trainer feature
  const trainer2Password = await bcrypt.hash("trainer2", 12);
  const trainer2 = await prisma.trainer.upsert({
    where: { email: "trainer2@gym.com" },
    update: {},
    create: {
      email: "trainer2@gym.com",
      passwordHash: trainer2Password,
      firstName: "Lisa",
      lastName: "Becker",
      phone: "+49 123 456799",
      role: "TRAINER",
      isActive: true,
    },
  });
  console.log("✅ Created second trainer:", trainer2.email);
  console.log("   Password: trainer2");

  // Create approved test athlete
  const athletePassword = await bcrypt.hash("athlete123", 12);
  const athlete = await prisma.athlete.upsert({
    where: { email: "athlete@test.com" },
    update: {},
    create: {
      email: "athlete@test.com",
      passwordHash: athletePassword,
      firstName: "Lisa",
      lastName: "Weber",
      birthDate: new Date("2015-05-15"),
      gender: "FEMALE",
      phone: "+49 123 456791",
      youthCategory: "E",
      competitionParticipation: true,
      isApproved: true,
      approvedBy: trainer.id,
      approvedAt: new Date(),
      configuredAt: new Date(),
      guardianName: "Maria Weber",
      guardianEmail: "maria.weber@test.com",
      guardianPhone: "+49 123 456792",
    },
  });
  console.log("✅ Created approved test athlete:", athlete.email);
  console.log("   Password: athlete123");

  // Create pending test athlete
  const pendingPassword = await bcrypt.hash("pending123", 12);
  const pendingAthlete = await prisma.athlete.upsert({
    where: { email: "pending@test.com" },
    update: {},
    create: {
      email: "pending@test.com",
      passwordHash: pendingPassword,
      firstName: "Tom",
      lastName: "Becker",
      birthDate: new Date("2016-08-20"),
      gender: "MALE",
      phone: "+49 123 456793",
      youthCategory: "F",
      competitionParticipation: false,
      isApproved: false, // Pending approval
    },
  });
  console.log("✅ Created pending athlete:", pendingAthlete.email);
  console.log("   Password: pending123 (cannot log in yet - not approved)");

  // Create recurring training templates
  const mondayG1 = await prisma.recurringTraining.create({
    data: {
      name: "Montag 17:00 - Gruppe 1",
      dayOfWeek: "MONDAY",
      startTime: "17:00",
      endTime: "18:30",
      groupNumber: 1,
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
    },
  });
  console.log("✅ Created recurring training: Montag 17:00 - Gruppe 1");

  const mondayG2 = await prisma.recurringTraining.create({
    data: {
      name: "Montag 18:30 - Gruppe 2",
      dayOfWeek: "MONDAY",
      startTime: "18:30",
      endTime: "20:00",
      groupNumber: 2,
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
    },
  });
  console.log("✅ Created recurring training: Montag 18:30 - Gruppe 2");

  const thursdayG1 = await prisma.recurringTraining.create({
    data: {
      name: "Donnerstag 17:00 - Gruppe 1",
      dayOfWeek: "THURSDAY",
      startTime: "17:00",
      endTime: "18:30",
      groupNumber: 1,
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
    },
  });
  console.log("✅ Created recurring training: Donnerstag 17:00 - Gruppe 1");

  const fridayG3 = await prisma.recurringTraining.create({
    data: {
      name: "Freitag 16:00 - Gruppe 3",
      dayOfWeek: "FRIDAY",
      startTime: "16:00",
      endTime: "17:30",
      groupNumber: 3,
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
    },
  });
  console.log("✅ Created recurring training: Freitag 16:00 - Gruppe 3");

  // Assign approved athlete to recurring trainings
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      recurringTrainingId: mondayG1.id,
      athleteId: athlete.id,
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      recurringTrainingId: thursdayG1.id,
      athleteId: athlete.id,
      assignedBy: admin.id,
    },
  });
  console.log("✅ Assigned athlete to 2 recurring trainings");

  // Assign trainers to recurring trainings
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      recurringTrainingId: mondayG1.id,
      trainerId: trainer.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      recurringTrainingId: mondayG1.id,
      trainerId: trainer2.id,
      isPrimary: false,
      assignedBy: admin.id,
    },
  });
  console.log("✅ Assigned 2 trainers to Montag Gruppe 1");

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      recurringTrainingId: mondayG2.id,
      trainerId: trainer.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  console.log("✅ Assigned trainer to Montag Gruppe 2");

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      recurringTrainingId: thursdayG1.id,
      trainerId: trainer2.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  console.log("✅ Assigned trainer to Donnerstag Gruppe 1");

  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      recurringTrainingId: fridayG3.id,
      trainerId: trainer.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  console.log("✅ Assigned trainer to Freitag Gruppe 3");

  // Generate training sessions from recurring templates (next 8 weeks)
  const today = new Date();
  let totalSessions = 0;

  const recurringTrainings = [mondayG1, mondayG2, thursdayG1, fridayG3];
  
  for (const rt of recurringTrainings) {
    const dayOfWeekMap: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 0,
    };

    const targetDayOfWeek = dayOfWeekMap[rt.dayOfWeek];
    const currentDate = new Date(today);
    
    // Find next occurrence of target day
    while (currentDate.getDay() !== targetDayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate 8 weeks of sessions
    for (let week = 0; week < 8; week++) {
      const sessionDate = new Date(currentDate);
      sessionDate.setDate(currentDate.getDate() + (week * 7));
      sessionDate.setHours(0, 0, 0, 0);

      const session = await prisma.trainingSession.create({
        data: {
          date: sessionDate,
          dayOfWeek: rt.dayOfWeek,
          startTime: rt.startTime,
          endTime: rt.endTime,
          groupNumber: rt.groupNumber,
          recurringTrainingId: rt.id,
        },
      });

      // Copy trainer assignments to session
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { recurringTrainingId: rt.id },
      });

      for (const ta of trainerAssignments) {
        await prisma.trainerSessionAssignment.create({
          data: {
            sessionId: session.id,
            trainerId: ta.trainerId,
          },
        });
      }

      totalSessions++;
    }
  }

  console.log(`✅ Generated ${totalSessions} training sessions for the next 8 weeks`);

  // Create default upload categories
  const defaultCategories = [
    { name: 'Kraftziele', description: 'Kraft- und Fitnessziele', sortOrder: 1 },
    { name: 'Kraftübungen', description: 'Übungen für Kraft und Fitness', sortOrder: 2 },
    { name: 'Dehnziele', description: 'Flexibilitäts- und Dehnziele', sortOrder: 3 },
    { name: 'Dehnübungen', description: 'Übungen für Dehnung und Flexibilität', sortOrder: 4 },
    { name: 'Allgemeine Dokumente', description: 'Sonstige Dokumente und Dateien', sortOrder: 5 },
  ];

  for (const category of defaultCategories) {
    await prisma.uploadCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  console.log(`✅ Created ${defaultCategories.length} default upload categories`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Test Accounts:");
  console.log("   Admin: admin@gym.com / admin123");
  console.log("   Trainer: trainer@gym.com / trainer123");
  console.log("   Trainer 2: trainer2@gym.com / trainer2");
  console.log("   Athlete (approved): athlete@test.com / athlete123");
  console.log("   Athlete (pending): pending@test.com / pending123");
  console.log("\n📅 Recurring Trainings Created:");
  console.log("   - Montag 17:00 - Gruppe 1 (2 trainers assigned)");
  console.log("   - Montag 18:30 - Gruppe 2");
  console.log("   - Donnerstag 17:00 - Gruppe 1");
  console.log("   - Freitag 16:00 - Gruppe 3");
  console.log("\n💡 Next Steps:");
  console.log("   1. Login as admin@gym.com");
  console.log("   2. Go to 'Wiederkehrende Trainings'");
  console.log("   3. Manage athletes, trainers, and generate more sessions as needed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });