import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { TrainerSessionsContent } from '@/components/trainer/sessions-content';

export default async function TrainerSessionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <TrainerLayout
      userName={session.user.name}
      isAdmin={session.user.activeRole === 'ADMIN'}
    >
      <TrainerSessionsContent />
    </TrainerLayout>
  );
}