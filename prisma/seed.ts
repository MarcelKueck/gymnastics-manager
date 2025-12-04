import { PrismaClient, YouthCategory, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Calculate youth category based on DTB rules
function calculateYouthCategory(birthDate: Date): YouthCategory {
  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();
  const ageThisYear = currentYear - birthYear;

  if (ageThisYear >= 18) return YouthCategory.ADULT;
  if (ageThisYear >= 16) return YouthCategory.A;
  if (ageThisYear >= 14) return YouthCategory.B;
  if (ageThisYear >= 12) return YouthCategory.C;
  if (ageThisYear >= 10) return YouthCategory.D;
  if (ageThisYear >= 8) return YouthCategory.E;
  return YouthCategory.F;
}

async function main() {
  console.log('🌱 Starting seed for production...');

  // Clean up existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning up existing data...');
  await prisma.competitionRegistration.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.absenceAlert.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.trainerAttendanceRecord.deleteMany();
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
  await prisma.upload.deleteMany();
  await prisma.uploadCategory.deleteMany();
  await prisma.athleteProfile.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
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
      attendanceConfirmationMode: 'REQUIRE_CONFIRMATION',
    },
  });

  // Hash password - should be changed after first login
  const hashedPassword = await bcrypt.hash('Turnen2024!', 10);

  // ============================================================================
  // PRIMARY ADMIN: Veronika Raum (Admin + Trainer + Athlete)
  // ============================================================================
  console.log('👤 Creating primary admin: Veronika Raum...');
  const veronikaBirthDate = new Date('1985-06-15');
  const veronika = await prisma.user.create({
    data: {
      email: 'vroni@raumonline.de',
      passwordHash: hashedPassword,
      firstName: 'Veronika',
      lastName: 'Raum',
      phone: '+49 170 1234567',
      birthDate: veronikaBirthDate,
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

  await prisma.athleteProfile.create({
    data: {
      userId: veronika.id,
      youthCategory: calculateYouthCategory(veronikaBirthDate), // Auto-calculated
      status: 'ACTIVE',
      isApproved: true,
      approvedBy: veronikaTrainerProfile.id,
      approvedAt: new Date(),
      hasDtbId: true,
      competitionParticipation: true,
    },
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('');
  console.log('✨ Production seed completed successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📧 Admin Account (Password: Turnen2024!)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔑 PRIMARY ADMIN (Admin + Trainer + Athlete):');
  console.log('   Email: vroni@raumonline.de');
  console.log('   Name: Veronika Raum');
  console.log('   Roles: Admin, Trainer, Athlete');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the password after first login!');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🚀 The database is now ready for production use.');
  console.log('   - Create recurring trainings in the admin panel');
  console.log('   - Athletes can register and await approval');
  console.log('   - Add more trainers as needed');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
