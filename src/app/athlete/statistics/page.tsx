import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AthleteLayout } from '@/components/athlete/athlete-layout';
import { AthleteStatisticsContent } from '@/components/athlete/statistics-content';

export default async function AthleteStatisticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ATHLETE') {
    redirect('/login');
  }

  return (
    <AthleteLayout userName={session.user.name}>
      <AthleteStatisticsContent />
    </AthleteLayout>
  );
}