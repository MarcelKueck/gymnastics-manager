import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AthleteLayout } from '@/components/athlete/athlete-layout';
import { AthleteCompetitionsContent } from '@/components/athlete/competitions-content';

export default async function AthleteCompetitionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.activeRole !== 'ATHLETE') {
    redirect('/login');
  }

  return (
    <AthleteLayout userName={session.user.name}>
      <AthleteCompetitionsContent />
    </AthleteLayout>
  );
}
