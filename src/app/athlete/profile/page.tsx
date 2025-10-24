import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AthleteLayout } from '@/components/athlete/athlete-layout';
import { AthleteProfileContent } from '@/components/athlete/profile-content';

export default async function AthleteProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.activeRole !== 'ATHLETE') {
    redirect('/login');
  }

  return (
    <AthleteLayout userName={session.user.name}>
      <AthleteProfileContent />
    </AthleteLayout>
  );
}