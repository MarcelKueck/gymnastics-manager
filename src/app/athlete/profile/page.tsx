'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { User, Mail, Phone, Save, Check, Lock } from 'lucide-react';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function AthleteProfile() {
  useSession(); // Ensure session is active
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isRequestingPasswordReset, setIsRequestingPasswordReset] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  useEffect(() => {
    fetch('/api/athlete/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setProfile(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/athlete/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error('Failed to save');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;
  if (!profile) return <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Profil konnte nicht geladen werden</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold sm:text-2xl">Mein Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Persönliche Daten
          </CardTitle>
          <CardDescription>
            Aktualisiere deine Kontaktinformationen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {success ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Gespeichert
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <p className="font-medium">Aktuelle Rolle</p>
              <p className="text-sm text-muted-foreground">Athlet</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <p className="font-medium">Passwort ändern</p>
              <p className="text-sm text-muted-foreground">
                {passwordResetSent 
                  ? 'E-Mail gesendet! Überprüfe dein Postfach.'
                  : 'Fordere einen Link zum Zurücksetzen an'}
              </p>
            </div>
            <Button 
              variant="outline" 
              disabled={isRequestingPasswordReset || passwordResetSent}
              className="w-full sm:w-auto"
              onClick={async () => {
                if (!profile?.email) return;
                setIsRequestingPasswordReset(true);
                try {
                  const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: profile.email }),
                  });
                  if (res.ok) {
                    setPasswordResetSent(true);
                  }
                } catch {
                  // Ignore errors
                } finally {
                  setIsRequestingPasswordReset(false);
                }
              }}
            >
              <Lock className="h-4 w-4 mr-2" />
              {isRequestingPasswordReset ? 'Wird gesendet...' : passwordResetSent ? 'Gesendet' : 'Link anfordern'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
