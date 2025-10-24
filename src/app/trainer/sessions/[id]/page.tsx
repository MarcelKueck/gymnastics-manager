import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { SessionDetailContent } from '@/components/trainer/session-detail-content';

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <TrainerLayout
      userName={session.user.name}
      isAdmin={session.user.activeRole === 'ADMIN'}
    >
      <SessionDetailContent sessionId={params.id} />
    </TrainerLayout>
  );
}