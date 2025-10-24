import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { TrainerStatisticsContent } from '@/components/trainer/statistics-content';

export default async function TrainerStatisticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <TrainerLayout
      userName={session.user.name}
      isAdmin={session.user.activeRole === 'ADMIN'}
    >
      <TrainerStatisticsContent />
    </TrainerLayout>
  );
}
