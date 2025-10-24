'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

export function AthleteProfileContent() {
  const [athlete, setAthlete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/athlete/profile');
      if (!response.ok) throw new Error('Fehler beim Laden des Profils');

      const data = await response.json();
      setAthlete(data.data);
      setFormData({
        firstName: data.data.firstName,
        lastName: data.data.lastName,
        phone: data.data.phone || '',
        guardianName: data.data.guardianName || '',
        guardianEmail: data.data.guardianEmail || '',
        guardianPhone: data.data.guardianPhone || '',
        emergencyContactName: data.data.emergencyContactName || '',
        emergencyContactPhone: data.data.emergencyContactPhone || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/athlete/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      toast.success('Profil erfolgreich aktualisiert');
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

  if (error && !athlete) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!athlete) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground">Verwalte deine persönlichen Informationen</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Persönliche Informationen</CardTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                Bearbeiten
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  disabled={isSaving}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Speichern...' : 'Speichern'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {athlete.firstName} {athlete.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p className="font-medium">{athlete.email}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Geburtsdatum</p>
                  <p className="font-medium">{formatDate(athlete.birthDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{athlete.phone || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Training Information */}
      <Card>
        <CardHeader>
          <CardTitle>Trainingsinformationen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Jugendkategorie</p>
              <p className="font-medium">
                {athlete.youthCategory
                  ? YOUTH_CATEGORY_LABELS[athlete.youthCategory as keyof typeof YOUTH_CATEGORY_LABELS]
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wettkampf</p>
              <p className="font-medium">{athlete.competitionParticipation ? 'Ja' : 'Nein'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DTB-ID</p>
              <p className="font-medium">{athlete.hasDtbId ? 'Vorhanden' : 'Nicht vorhanden'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{athlete.isApproved ? 'Genehmigt' : 'Ausstehend'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Groups */}
      {athlete.recurringTrainingAssignments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trainingsgruppen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {athlete.recurringTrainingAssignments.map((assignment: any) => (
                <div key={assignment.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{assignment.trainingGroup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {assignment.trainingGroup.recurringTraining.name} -{' '}
                    {assignment.trainingGroup.recurringTraining.startTime} bis{' '}
                    {assignment.trainingGroup.recurringTraining.endTime}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guardian Information */}
      {(athlete.guardianName || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>Erziehungsberechtigter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Name</Label>
                  <Input
                    id="guardianName"
                    value={formData.guardianName}
                    onChange={(e) => handleChange('guardianName', e.target.value)}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">E-Mail</Label>
                    <Input
                      id="guardianEmail"
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) => handleChange('guardianEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Telefon</Label>
                    <Input
                      id="guardianPhone"
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => handleChange('guardianPhone', e.target.value)}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{athlete.guardianName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-Mail</p>
                  <p className="font-medium">{athlete.guardianEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium">{athlete.guardianPhone || '-'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Notfallkontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Name</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Telefon</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{athlete.emergencyContactName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{athlete.emergencyContactPhone || '-'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}