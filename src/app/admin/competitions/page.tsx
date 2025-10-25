import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AdminCompetitionsContent } from '@/components/admin/competitions-content';

export default async function AdminCompetitionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    redirect('/login');
  }

  return <AdminCompetitionsContent />;
}
