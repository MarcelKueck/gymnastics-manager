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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    guardianEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name ist erforderlich';
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

    if (formData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
      errors.guardianEmail = 'Ungültige E-Mail-Adresse';
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
          name: formData.name,
          email: formData.email,
          password: formData.password,
          guardianEmail: formData.guardianEmail || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }

      // Redirect to login with success message
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
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
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Registrierung
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Erstelle deinen Athleten-Account
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm sm:text-base">
              Vollständiger Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Max Mustermann"
              required
              disabled={loading}
              className={`mt-1 text-base ${fieldErrors.name ? 'border-red-500' : ''}`}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>
            )}
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

          <div>
            <Label htmlFor="guardianEmail" className="text-sm sm:text-base">
              Erziehungsberechtigter E-Mail (optional)
            </Label>
            <Input
              id="guardianEmail"
              type="email"
              value={formData.guardianEmail}
              onChange={(e) => handleChange('guardianEmail', e.target.value)}
              placeholder="eltern@email.de"
              disabled={loading}
              className={`mt-1 text-base ${fieldErrors.guardianEmail ? 'border-red-500' : ''}`}
              autoComplete="email"
            />
            {fieldErrors.guardianEmail && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.guardianEmail}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Wird für wichtige Mitteilungen benachrichtigt
            </p>
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
              von einem Trainer freigeschaltet werden, bevor du dich anmelden kannst.
            </p>
          </Alert>
        </div>
      </Card>
    </div>
  );
}