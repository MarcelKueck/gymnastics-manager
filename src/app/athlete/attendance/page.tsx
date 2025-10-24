import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AthleteLayout } from '@/components/athlete/athlete-layout';
import { AthleteAttendanceContent } from '@/components/athlete/attendance-content';

export default async function AthleteAttendancePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.activeRole !== 'ATHLETE') {
    redirect('/login');
  }

  return (
    <AthleteLayout userName={session.user.name}>
      <AthleteAttendanceContent />
    </AthleteLayout>
  );
}