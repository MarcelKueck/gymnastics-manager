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
      hasDtbId: true,
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

  // Create more test athletes with different ages for age groups
  const athletes = [
    { email: "anna@test.com", firstName: "Anna", lastName: "Klein", birthDate: new Date("2017-03-15"), category: "E" }, // E-Jugend
    { email: "ben@test.com", firstName: "Ben", lastName: "Fischer", birthDate: new Date("2016-07-22"), category: "E" }, // E-Jugend
    { email: "clara@test.com", firstName: "Clara", lastName: "Hoffmann", birthDate: new Date("2015-05-10"), category: "D" }, // D-Jugend
    { email: "david@test.com", firstName: "David", lastName: "Richter", birthDate: new Date("2014-09-03"), category: "D" }, // D-Jugend
    { email: "emma@test.com", firstName: "Emma", lastName: "Koch", birthDate: new Date("2013-11-28"), category: "E" }, // C-Jugend
  ];

  for (const a of athletes) {
    const pwd = await bcrypt.hash("test123", 12);
    await prisma.athlete.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash: pwd,
        firstName: a.firstName,
        lastName: a.lastName,
        birthDate: a.birthDate,
        gender: "FEMALE",
        phone: `+49 123 ${Math.random().toString().slice(2, 11)}`,
        youthCategory: a.category as any,
        isApproved: true,
        approvedBy: admin.id,
        approvedAt: new Date(),
        configuredAt: new Date(),
      },
    });
    console.log(`✅ Created test athlete: ${a.email} (born ${a.birthDate.getFullYear()})`);
  }

  // Create recurring training templates with NAMED GROUPS
  console.log("\n📅 Creating recurring trainings with named groups...");
  
  // Monday morning training
  const mondayMorning = await prisma.recurringTraining.create({
    data: {
      name: "Montag 17:00 - Nachmittagstraining",
      dayOfWeek: "MONDAY",
      startTime: "17:00",
      endTime: "18:30",
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
      groups: {
        create: [
          { name: "Anfänger", description: "Einsteiger und Grundlagen", sortOrder: 1 },
          { name: "Fortgeschrittene", description: "Mittleres Niveau", sortOrder: 2 },
          { name: "Wettkampf", description: "Wettkampfvorbereitung", sortOrder: 3 },
        ],
      },
    },
    include: { groups: true },
  });
  console.log(`✅ Created: ${mondayMorning.name}`);
  console.log(`   Groups: ${mondayMorning.groups.map(g => g.name).join(", ")}`);

  // Thursday evening training
  const thursdayEvening = await prisma.recurringTraining.create({
    data: {
      name: "Donnerstag 18:00 - Abendtraining",
      dayOfWeek: "THURSDAY",
      startTime: "18:00",
      endTime: "19:30",
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
      groups: {
        create: [
          { name: "Anfänger", description: "Neue Turnerinnen", sortOrder: 1 },
          { name: "Fortgeschrittene", description: "Erfahrene Turnerinnen", sortOrder: 2 },
        ],
      },
    },
    include: { groups: true },
  });
  console.log(`✅ Created: ${thursdayEvening.name}`);
  console.log(`   Groups: ${thursdayEvening.groups.map(g => g.name).join(", ")}`);

  // Friday afternoon training
  const fridayAfternoon = await prisma.recurringTraining.create({
    data: {
      name: "Freitag 16:00 - Freitagstraining",
      dayOfWeek: "FRIDAY",
      startTime: "16:00",
      endTime: "17:30",
      recurrenceInterval: "WEEKLY",
      startDate: new Date(),
      isActive: true,
      createdBy: admin.id,
      groups: {
        create: [
          { name: "Mini-Turner", description: "Die Kleinsten", sortOrder: 1 },
          { name: "Wettkampf", description: "Intensivtraining", sortOrder: 2 },
        ],
      },
    },
    include: { groups: true },
  });
  console.log(`✅ Created: ${fridayAfternoon.name}`);
  console.log(`   Groups: ${fridayAfternoon.groups.map(g => g.name).join(", ")}`);

  // Get all created athletes
  const allAthletes = await prisma.athlete.findMany({
    where: { isApproved: true },
  });

  // Assign athletes to training groups
  console.log("\n👥 Assigning athletes to groups...");
  
  // Monday: Assign different athletes to different groups
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[0].id, // Anfänger
      athleteId: allAthletes[1].id, // Anna
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[0].id, // Anfänger
      athleteId: allAthletes[2].id, // Ben
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[1].id, // Fortgeschrittene
      athleteId: allAthletes[3].id, // Clara
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[2].id, // Wettkampf
      athleteId: allAthletes[4].id, // David
      assignedBy: admin.id,
    },
  });
  console.log(`✅ Assigned 4 athletes to Monday training groups`);

  // Thursday: Assign athletes to groups (can be different from Monday!)
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      trainingGroupId: thursdayEvening.groups[0].id, // Anfänger
      athleteId: allAthletes[1].id, // Anna (also in Monday Anfänger)
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingAthleteAssignment.create({
    data: {
      trainingGroupId: thursdayEvening.groups[1].id, // Fortgeschrittene
      athleteId: allAthletes[3].id, // Clara (was in Monday Fortgeschrittene)
      assignedBy: admin.id,
    },
  });
  console.log(`✅ Assigned 2 athletes to Thursday training groups`);

  // Assign trainers to training groups
  console.log("\n👨‍🏫 Assigning trainers to groups...");
  
  // Monday trainers
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[0].id, // Anfänger
      trainerId: trainer.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[1].id, // Fortgeschrittene
      trainerId: trainer2.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[2].id, // Wettkampf
      trainerId: trainer.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: mondayMorning.groups[2].id, // Wettkampf (2nd trainer)
      trainerId: trainer2.id,
      isPrimary: false,
      assignedBy: admin.id,
    },
  });
  console.log(`✅ Assigned trainers to Monday groups`);

  // Thursday trainers
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: thursdayEvening.groups[0].id,
      trainerId: trainer.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  await prisma.recurringTrainingTrainerAssignment.create({
    data: {
      trainingGroupId: thursdayEvening.groups[1].id,
      trainerId: trainer2.id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });
  console.log(`✅ Assigned trainers to Thursday groups`);

  // Generate training sessions from recurring templates (next 8 weeks)
  console.log("\n📅 Generating training sessions...");
  const today = new Date();
  let totalSessions = 0;
  let totalSessionGroups = 0;

  const allRecurringTrainings = await prisma.recurringTraining.findMany({
    include: { groups: true },
  });
  
  for (const rt of allRecurringTrainings) {
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

      // Create the training session
      const session = await prisma.trainingSession.create({
        data: {
          date: sessionDate,
          dayOfWeek: rt.dayOfWeek,
          startTime: rt.startTime,
          endTime: rt.endTime,
          recurringTrainingId: rt.id,
        },
      });
      totalSessions++;

      // Create SessionGroups for each TrainingGroup
      for (const group of rt.groups) {
        const sessionGroup = await prisma.sessionGroup.create({
          data: {
            trainingSessionId: session.id,
            trainingGroupId: group.id,
            exercises: week === 0 ? `Beispiel Übungen für ${group.name}:\n- Aufwärmen\n- Grundübungen\n- Cool down` : null,
          },
        });
        totalSessionGroups++;

        // Copy trainer assignments from recurring to session
        const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
          where: { trainingGroupId: group.id },
        });

        for (const ta of trainerAssignments) {
          await prisma.sessionGroupTrainerAssignment.create({
            data: {
              sessionGroupId: sessionGroup.id,
              trainerId: ta.trainerId,
            },
          });
        }
      }
    }
  }

  console.log(`✅ Generated ${totalSessions} training sessions`);
  console.log(`✅ Generated ${totalSessionGroups} session groups with trainer assignments`);

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
  console.log("   + 5 more test athletes (anna@test.com, ben@test.com, etc.) / test123");
  console.log("\n📅 Recurring Trainings Created:");
  console.log("   - Montag 17:00 (3 groups: Anfänger, Fortgeschrittene, Wettkampf)");
  console.log("   - Donnerstag 18:00 (2 groups: Anfänger, Fortgeschrittene)");
  console.log("   - Freitag 16:00 (2 groups: Mini-Turner, Wettkampf)");
  console.log("\n👥 Athletes assigned to groups across different sessions");
  console.log("   (Demonstrating: athlete can be in different groups on different days)");
  console.log("\n💡 Next Steps:");
  console.log("   1. Login as admin@gym.com");
  console.log("   2. Go to 'Wiederkehrende Trainings'");
  console.log("   3. View named groups and manage athletes/trainers");
  console.log("   4. Login as trainer to see sessions with exercises per group");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });