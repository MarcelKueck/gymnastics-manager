const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.trainingSession.findMany({
    where: {
      date: {
        gte: new Date('2025-12-04'),
        lte: new Date('2025-12-07'),
      }
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      recurringTraining: { select: { name: true, dayOfWeek: true, startTime: true } }
    },
    orderBy: { date: 'asc' }
  });
  
  console.log('Sessions in DB:', sessions.length);
  for (const s of sessions) {
    console.log('---');
    console.log('ID:', s.id);
    console.log('Date (raw):', s.date);
    console.log('Date (ISO):', s.date.toISOString());
    console.log('Date (local):', s.date.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
    console.log('StartTime:', s.startTime || s.recurringTraining?.startTime || 'N/A');
    console.log('Training:', s.recurringTraining?.name, '(' + s.recurringTraining?.dayOfWeek + ')');
  }
}

main().catch(e => console.error('Error:', e)).finally(() => prisma.$disconnect());
