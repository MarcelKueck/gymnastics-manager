import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Redirect based on active role
  switch (session.user.activeRole) {
    case UserRole.ATHLETE:
      redirect('/athlete/dashboard');
    case UserRole.TRAINER:
      redirect('/trainer/dashboard');
    case UserRole.ADMIN:
      redirect('/trainer/dashboard');
    default:
      redirect('/login');
  }
}
