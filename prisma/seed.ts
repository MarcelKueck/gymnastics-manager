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

  // Create group assignments for approved athlete
  const groupAssignment = await prisma.athleteGroupAssignment.create({
    data: {
      athleteId: athlete.id,
      groupNumber: 1,
      hourNumber: 1,
      trainingDay: "MONDAY",
      isActive: true,
      assignedBy: trainer.id,
    },
  });
  console.log("✅ Created group assignment for approved athlete");

  // Create some future training sessions
  const today = new Date();
  const sessionsToCreate = [];

  // Create sessions for next 4 weeks
  for (let week = 0; week < 4; week++) {
    const monday = new Date(today);
    monday.setDate(today.getDate() + (week * 7) + (1 - today.getDay()));

    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    // Monday sessions (groups 1, 2, 3, hours 1 & 2)
    for (let group = 1; group <= 3; group++) {
      for (let hour = 1; hour <= 2; hour++) {
        sessionsToCreate.push({
          date: monday,
          dayOfWeek: "MONDAY",
          hourNumber: hour,
          groupNumber: group,
        });
      }
    }

    // Thursday sessions
    for (let group = 1; group <= 3; group++) {
      for (let hour = 1; hour <= 2; hour++) {
        sessionsToCreate.push({
          date: thursday,
          dayOfWeek: "THURSDAY",
          hourNumber: hour,
          groupNumber: group,
        });
      }
    }

    // Friday sessions
    for (let group = 1; group <= 3; group++) {
      for (let hour = 1; hour <= 2; hour++) {
        sessionsToCreate.push({
          date: friday,
          dayOfWeek: "FRIDAY",
          hourNumber: hour,
          groupNumber: group,
        });
      }
    }
  }

  // Insert sessions
  for (const session of sessionsToCreate) {
    await prisma.trainingSession.create({
      data: session as any,
    });
  }
  console.log(`✅ Created ${sessionsToCreate.length} training sessions`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Test Accounts:");
  console.log("   Trainer: trainer@gym.com / trainer123");
  console.log("   Trainer 2: trainer2@gym.com / trainer2");
  console.log("   Admin: admin@gym.com / admin123");
  console.log("   Athlete (approved): athlete@test.com / athlete123");
  console.log("   Athlete (pending): pending@test.com / pending123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });