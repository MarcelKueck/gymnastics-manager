import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { TrainerFilesContent } from '@/components/trainer/files-content';

export default async function TrainerFilesPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <TrainerLayout
      userName={session.user.name}
      isAdmin={session.user.role === 'ADMIN'}
    >
      <TrainerFilesContent />
    </TrainerLayout>
  );
}
