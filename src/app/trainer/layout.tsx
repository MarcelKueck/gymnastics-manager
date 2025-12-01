import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrainerNavigation } from '@/components/trainer/navigation';

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.activeRole;
  if (role !== 'TRAINER' && role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <TrainerNavigation user={session.user} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
