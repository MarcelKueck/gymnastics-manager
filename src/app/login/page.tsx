'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Ungültige E-Mail oder Passwort');
        setLoading(false);
        return;
      }

      // Get session to check role
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      // Redirect based on role
      if (session?.user?.role === 'TRAINER') {
        router.push('/trainer/dashboard');
      } else if (session?.user?.role === 'ATHLETE') {
        router.push('/athlete/dashboard');
      } else if (session?.user?.role === 'ADMIN') {
        router.push('/trainer/dashboard'); // Admin uses trainer portal
      } else {
        router.push('/');
      }
      
      router.refresh();
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Willkommen zurück
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Melde dich bei deinem Turnverein-Portal an
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4 sm:mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <Label htmlFor="email" className="text-sm sm:text-base">
              E-Mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              disabled={loading}
              className="mt-1 text-base" // Prevents zoom on iOS
              autoComplete="email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm sm:text-base">
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="mt-1 text-base" // Prevents zoom on iOS
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#509f28] hover:bg-[#3d7a1f] text-white h-11 sm:h-12 text-base sm:text-lg font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Wird angemeldet...
              </>
            ) : (
              'Anmelden'
            )}
          </Button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Noch kein Account?{' '}
            <Link
              href="/register"
              className="text-[#509f28] hover:text-[#3d7a1f] font-medium"
            >
              Jetzt registrieren
            </Link>
          </p>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Demo-Accounts zum Testen:
          </p>
          <div className="mt-3 space-y-2 text-xs sm:text-sm">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-900">Trainer</p>
              <p className="text-gray-600">trainer@gym.com / trainer123</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-900">Athlet</p>
              <p className="text-gray-600">athlete@test.com / password123</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}