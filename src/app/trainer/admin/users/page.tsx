import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { AdminUsersContent } from '@/components/admin/users-content';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <TrainerLayout userName={session.user.name} isAdmin={true}>
      <AdminUsersContent />
    </TrainerLayout>
  );
}
