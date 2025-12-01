import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AthleteNavigation } from '@/components/athlete/navigation';

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session.user.activeRole !== 'ATHLETE') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-background">
      <AthleteNavigation user={session.user} />
      <main className="container py-6">{children}</main>
    </div>
  );
}
