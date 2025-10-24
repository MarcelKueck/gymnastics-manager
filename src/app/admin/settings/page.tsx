import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TrainerLayout } from '@/components/trainer/trainer-layout';
import { AdminSettingsContent } from '@/components/admin/admin-settings-content';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.activeRole !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <TrainerLayout userName={session.user.name} isAdmin={true}>
      <AdminSettingsContent />
    </TrainerLayout>
  );
}
