import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AthleteLayout } from '@/components/athlete/athlete-layout';
import { AthleteScheduleContent } from '@/components/athlete/schedule-content';

export default async function AthleteSchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ATHLETE') {
    redirect('/login');
  }

  return (
    <AthleteLayout userName={session.user.name}>
      <AthleteScheduleContent />
    </AthleteLayout>
  );
}