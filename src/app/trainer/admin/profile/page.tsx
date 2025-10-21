'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleTranslations: Record<string, string> = {
  TRAINER: 'Trainer',
  ADMIN: 'Administrator',
};

export default function AdminProfile() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
  });

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/profile');
      if (!response.ok) throw new Error('Failed to load profile');
      const data = await response.json();
      setProfile(data.admin);
      
      // Initialize edit form
      setEditForm({
        email: data.admin.email,
        phone: data.admin.phone,
      });
    } catch (err) {
      setError('Fehler beim Laden des Profils');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to current profile values
      if (profile) {
        setEditForm({
          email: profile.email,
          phone: profile.phone,
        });
      }
    }
    setIsEditing(!isEditing);
    setSuccess(null);
    setError(null);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await fetchProfile();
      setIsEditing(false);
      setSuccess('Profil erfolgreich aktualisiert');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Profils');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordError(null);

      // Validate passwords
      if (passwordForm.newPassword.length < 8) {
        setPasswordError('Neues Passwort muss mindestens 8 Zeichen lang sein');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('Passwörter stimmen nicht überein');
        return;
      }

      setChangingPassword(true);

      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      // Success
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setSuccess('Passwort erfolgreich geändert');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Fehler beim Ändern des Passworts');
      console.error(err);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Profil...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!profile) {
    return <Alert variant="error">Profil nicht gefunden</Alert>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Success/Error Messages */}
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Basic Information (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administrator Informationen
          </CardTitle>
          <CardDescription>Diese Daten können nicht geändert werden</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">Vorname</Label>
              <p className="font-medium">{profile.firstName}</p>
            </div>
            <div>
              <Label className="text-gray-600">Nachname</Label>
              <p className="font-medium">{profile.lastName}</p>
            </div>
            <div>
              <Label className="text-gray-600">Rolle</Label>
              <p className="font-medium">{roleTranslations[profile.role] || profile.role}</p>
            </div>
            <div>
              <Label className="text-gray-600">Mitglied seit</Label>
              <p className="font-medium">
                {format(new Date(profile.createdAt), 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kontaktinformationen</CardTitle>
              <CardDescription>Diese Daten können Sie bearbeiten</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleEditToggle}
              disabled={saving}
            >
              {isEditing ? 'Abbrechen' : 'Bearbeiten'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail *</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={saving}
                />
              ) : (
                <p className="font-medium mt-1">{profile.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Telefon *</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  disabled={saving}
                />
              ) : (
                <p className="font-medium mt-1">{profile.phone}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 flex gap-3">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
              <Button variant="outline" onClick={handleEditToggle} disabled={saving}>
                Abbrechen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>Ändern Sie Ihr Anmeldepasswort</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              Passwort ändern
            </Button>
          ) : (
            <div className="space-y-4">
              {passwordError && <Alert variant="error">{passwordError}</Alert>}

              <div>
                <Label htmlFor="currentPassword">Aktuelles Passwort *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  disabled={changingPassword}
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Neues Passwort *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  disabled={changingPassword}
                />
                <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Neues Passwort bestätigen *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  disabled={changingPassword}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handlePasswordChange} disabled={changingPassword}>
                  {changingPassword ? 'Ändern...' : 'Passwort ändern'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError(null);
                  }}
                  disabled={changingPassword}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-600">Status</Label>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.isActive ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-600">Letzte Aktualisierung</Label>
              <p className="font-medium">
                {format(new Date(profile.updatedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
