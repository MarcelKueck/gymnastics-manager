'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'athlete' | 'trainer'>('athlete');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    birthDate: '',
    gender: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Common fields for both user types
    if (!formData.firstName.trim()) {
      errors.firstName = 'Vorname ist erforderlich';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Nachname ist erforderlich';
    }

    if (!formData.email.trim()) {
      errors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ungültige E-Mail-Adresse';
    }

    if (!formData.password) {
      errors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 6) {
      errors.password = 'Passwort muss mindestens 6 Zeichen lang sein';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Telefonnummer ist erforderlich';
    }

    // Athlete-specific validations
    if (userType === 'athlete') {
      if (!formData.birthDate) {
        errors.birthDate = 'Geburtsdatum ist erforderlich';
      }

      if (!formData.gender) {
        errors.gender = 'Geschlecht ist erforderlich';
      }

      // Validate guardian email if provided
      if (formData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
        errors.guardianEmail = 'Ungültige E-Mail-Adresse';
      }

      // Validate emergency contact phone if name is provided
      if (formData.emergencyContactName && !formData.emergencyContactPhone) {
        errors.emergencyContactPhone = 'Telefonnummer des Notfallkontakts erforderlich';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          ...(userType === 'athlete' ? {
            birthDate: formData.birthDate,
            gender: formData.gender,
            guardianName: formData.guardianName || null,
            guardianEmail: formData.guardianEmail || null,
            guardianPhone: formData.guardianPhone || null,
            emergencyContactName: formData.emergencyContactName || null,
            emergencyContactPhone: formData.emergencyContactPhone || null,
          } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }

      // Redirect to login with success message
      router.push('/login?registered=true');
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Registrierung
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Erstelle deinen Account
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4 sm:mb-6">
            {error}
          </Alert>
        )}

        {/* User Type Selection */}
        <div className="mb-6">
          <Label className="text-sm sm:text-base mb-3 block">
            Ich bin ein... <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType('athlete')}
              className={`p-4 rounded-lg border-2 transition-all ${
                userType === 'athlete'
                  ? 'border-[#509f28] bg-[#509f28]/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold">Athlet</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setUserType('trainer')}
              className={`p-4 rounded-lg border-2 transition-all ${
                userType === 'trainer'
                  ? 'border-[#509f28] bg-[#509f28]/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-semibold">Trainer</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm sm:text-base">
                Vorname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Max"
                required
                disabled={loading}
                className={`mt-1 text-base ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                autoComplete="given-name"
              />
              {fieldErrors.firstName && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm sm:text-base">
                Nachname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Mustermann"
                required
                disabled={loading}
                className={`mt-1 text-base ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                autoComplete="family-name"
              />
              {fieldErrors.lastName && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-sm sm:text-base">
              E-Mail-Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="deine@email.de"
              required
              disabled={loading}
              className={`mt-1 text-base ${fieldErrors.email ? 'border-red-500' : ''}`}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm sm:text-base">
              Telefonnummer <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+49 123 456789"
              required
              disabled={loading}
              className={`mt-1 text-base ${fieldErrors.phone ? 'border-red-500' : ''}`}
              autoComplete="tel"
            />
            {fieldErrors.phone && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Athlete-specific fields */}
          {userType === 'athlete' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthDate" className="text-sm sm:text-base">
                    Geburtsdatum <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    required
                    disabled={loading}
                    className={`mt-1 text-base ${fieldErrors.birthDate ? 'border-red-500' : ''}`}
                  />
                  {fieldErrors.birthDate && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.birthDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender" className="text-sm sm:text-base">
                    Geschlecht <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    required
                    disabled={loading}
                    className={`mt-1 w-full rounded-md border ${
                      fieldErrors.gender ? 'border-red-500' : 'border-gray-300'
                    } px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#509f28]`}
                  >
                    <option value="">Bitte wählen</option>
                    <option value="MALE">Männlich</option>
                    <option value="FEMALE">Weiblich</option>
                    <option value="OTHER">Divers</option>
                  </select>
                  {fieldErrors.gender && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>

              {/* Guardian Information */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-3">Erziehungsberechtigte(r) (optional)</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guardianName" className="text-sm sm:text-base">
                      Name
                    </Label>
                    <Input
                      id="guardianName"
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => handleChange('guardianName', e.target.value)}
                      placeholder="Maria Mustermann"
                      disabled={loading}
                      className="mt-1 text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guardianEmail" className="text-sm sm:text-base">
                        E-Mail
                      </Label>
                      <Input
                        id="guardianEmail"
                        type="email"
                        value={formData.guardianEmail}
                        onChange={(e) => handleChange('guardianEmail', e.target.value)}
                        placeholder="eltern@email.de"
                        disabled={loading}
                        className={`mt-1 text-base ${fieldErrors.guardianEmail ? 'border-red-500' : ''}`}
                      />
                      {fieldErrors.guardianEmail && (
                        <p className="text-red-600 text-sm mt-1">{fieldErrors.guardianEmail}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="guardianPhone" className="text-sm sm:text-base">
                        Telefon
                      </Label>
                      <Input
                        id="guardianPhone"
                        type="tel"
                        value={formData.guardianPhone}
                        onChange={(e) => handleChange('guardianPhone', e.target.value)}
                        placeholder="+49 123 456789"
                        disabled={loading}
                        className="mt-1 text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-3">Notfallkontakt (optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName" className="text-sm sm:text-base">
                      Name
                    </Label>
                    <Input
                      id="emergencyContactName"
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                      placeholder="Kontaktperson"
                      disabled={loading}
                      className="mt-1 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactPhone" className="text-sm sm:text-base">
                      Telefon
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                      placeholder="+49 123 456789"
                      disabled={loading}
                      className={`mt-1 text-base ${fieldErrors.emergencyContactPhone ? 'border-red-500' : ''}`}
                    />
                    {fieldErrors.emergencyContactPhone && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.emergencyContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Password fields */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-sm sm:text-base">
                  Passwort <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                  required
                  disabled={loading}
                  className={`mt-1 text-base ${fieldErrors.password ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {fieldErrors.password && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base">
                  Passwort bestätigen <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Passwort wiederholen"
                  required
                  disabled={loading}
                  className={`mt-1 text-base ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                  autoComplete="new-password"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#509f28] hover:bg-[#3d7a1f] text-white h-11 sm:h-12 text-base sm:text-lg font-medium mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Wird registriert...
              </>
            ) : (
              'Registrieren'
            )}
          </Button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Bereits registriert?{' '}
            <Link
              href="/login"
              className="text-[#509f28] hover:text-[#3d7a1f] font-medium"
            >
              Jetzt anmelden
            </Link>
          </p>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <Alert>
            <p className="text-xs sm:text-sm text-gray-700">
              <strong>Hinweis:</strong> Nach der Registrierung muss dein Account
              {userType === 'athlete' 
                ? ' von einem Trainer freigeschaltet werden, bevor du dich anmelden kannst.'
                : ' von einem Administrator freigeschaltet werden, bevor du dich anmelden kannst.'}
            </p>
          </Alert>
        </div>
      </Card>
    </div>
  );
}