import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { AdminHoursContent } from '@/components/admin/hours-content';

export default async function AdminHoursPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <TrainerLayout
      userName={session.user.name}
      isAdmin={true}
    >
      <AdminHoursContent />
    </TrainerLayout>
  );
}
