'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { calculateAge, requiresGuardian } from '@/lib/ageGroups';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'MALE',
    phone: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuardianFields, setShowGuardianFields] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }

    // Check if guardian info is needed based on birth date
    if (field === 'birthDate' && value) {
      const birthDate = new Date(value);
      setShowGuardianFields(requiresGuardian(birthDate));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (showGuardianFields && (!formData.guardianName || !formData.guardianEmail)) {
      setError('Informationen zum Erziehungsberechtigten sind erforderlich');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if there are validation errors in the data field
        if (data.data && typeof data.data === 'object') {
          setValidationErrors(data.data);
          setError(data.error || 'Bitte korrigiere die markierten Felder');
        } else {
          throw new Error(data.error || 'Registrierung fehlgeschlagen');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8 safe-top safe-bottom">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-600 mx-auto" />
              <h2 className="text-xl md:text-2xl font-bold">Registrierung erfolgreich!</h2>
              <p className="text-sm md:text-base text-gray-600">
                Dein Account wurde erstellt. Du erhältst eine E-Mail, sobald er genehmigt wurde.
              </p>
              <p className="text-xs md:text-sm text-gray-500">Du wirst weitergeleitet...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6 md:py-8 safe-top safe-bottom">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl text-center">Registrieren</CardTitle>
          <CardDescription className="text-center text-xs md:text-sm">
            Erstelle einen neuen Athleten-Account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Display validation errors */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  <div className="space-y-1">
                    {Object.entries(validationErrors).map(([field, message]) => (
                      <div key={field}>• {message}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-base md:text-lg">Persönliche Informationen</h3>

              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 text-base"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm">Geburtsdatum *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    required
                    disabled={isLoading}
                    className={cn("h-11 text-base", validationErrors.birthDate ? 'border-red-500' : '')}
                  />
                  {validationErrors.birthDate && (
                    <p className="text-xs text-red-500">{validationErrors.birthDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Geschlecht *</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                    disabled={isLoading}
                  >
                    <option value="MALE">Männlich</option>
                    <option value="FEMALE">Weiblich</option>
                    <option value="OTHER">Divers</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+49..."
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Account-Informationen</h3>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail-Adresse *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="deine@email.de"
                  required
                  disabled={isLoading}
                  className={validationErrors.email ? 'border-red-500' : ''}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Mindestens 8 Zeichen"
                    required
                    disabled={isLoading}
                    className={validationErrors.password ? 'border-red-500' : ''}
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Muss mindestens 8 Zeichen, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Guardian Information (if under 18) */}
            {showGuardianFields && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Erziehungsberechtigter (erforderlich für unter 18-Jährige)
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="guardianName">Name des Erziehungsberechtigten *</Label>
                  <Input
                    id="guardianName"
                    value={formData.guardianName}
                    onChange={(e) => handleChange('guardianName', e.target.value)}
                    required={showGuardianFields}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">E-Mail *</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) => handleChange('guardianEmail', e.target.value)}
                      required={showGuardianFields}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Telefonnummer</Label>
                    <Input
                      id="guardianPhone"
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => handleChange('guardianPhone', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Notfallkontakt</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Telefonnummer</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Registriere...' : 'Registrieren'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Bereits registriert?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Anmelden
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