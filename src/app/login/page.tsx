'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Try trainer login first
      let result = await signIn('trainer-credentials', {
        email,
        password,
        redirect: false,
      });

      // Store first error for better error messages
      let firstError = result?.error;

      // If trainer login fails, try athlete login
      if (result?.error) {
        result = await signIn('athlete-credentials', {
          email,
          password,
          redirect: false,
        });
      }

      if (result?.error) {
        // Use the athlete error if available, otherwise use the first error
        const errorMessage = result.error || firstError;
        
        // Map error messages to user-friendly German messages
        if (errorMessage?.includes('pending approval')) {
          setError('Dein Account muss noch genehmigt werden. Du erhältst eine E-Mail, sobald dein Account aktiviert wurde.');
        } else if (errorMessage?.includes('deactivated')) {
          setError('Dein Account wurde deaktiviert. Bitte kontaktiere einen Administrator.');
        } else if (errorMessage?.includes('Invalid email or password')) {
          setError('Ungültige E-Mail-Adresse oder Passwort');
        } else {
          setError(errorMessage || 'Ungültige E-Mail-Adresse oder Passwort');
        }
      } else {
        // Redirect will be handled by the callback
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Anmelden</CardTitle>
          <CardDescription className="text-center">
            Melde dich mit deinem Account an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Noch kein Account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Registrieren
              </Link>
            </p>
            <Link href="/" className="text-sm text-gray-600 hover:underline block">
              Zurück zur Startseite
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}