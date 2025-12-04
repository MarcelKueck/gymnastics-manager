'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Copy, Check, AlertCircle } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: UserProfile) => void;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAthlete: boolean;
  isTrainer: boolean;
  athleteProfile: {
    id: string;
    status: string;
    youthCategory: string;
  } | null;
  trainerProfile: {
    id: string;
    role: string;
    isActive: boolean;
  } | null;
  createdAt: string;
}

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  gender: string;
  isAthlete: boolean;
  isTrainer: boolean;
  trainerRole: 'TRAINER' | 'ADMIN';
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

const initialFormData: FormData = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  birthDate: '',
  gender: '',
  isAthlete: true,
  isTrainer: false,
  trainerRole: 'TRAINER',
  guardianName: '',
  guardianEmail: '',
  guardianPhone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export function CreateUserDialog({
  open,
  onOpenChange,
  onUserCreated,
}: CreateUserDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{
    user: UserProfile;
    tempPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Validate at least one role is selected
    if (!formData.isAthlete && !formData.isTrainer) {
      setError('Mindestens eine Rolle muss ausgewählt werden');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          gender: formData.gender || undefined,
          birthDate: formData.birthDate || undefined,
          trainerRole: formData.isTrainer ? formData.trainerRole : undefined,
          // youthCategory is now auto-calculated from birthDate on the server
          guardianName: formData.isAthlete ? formData.guardianName : undefined,
          guardianEmail: formData.isAthlete ? formData.guardianEmail : undefined,
          guardianPhone: formData.isAthlete ? formData.guardianPhone : undefined,
          emergencyContactName: formData.isAthlete ? formData.emergencyContactName : undefined,
          emergencyContactPhone: formData.isAthlete ? formData.emergencyContactPhone : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      setCreatedUser({
        user: data.data,
        tempPassword: data.tempPassword,
      });
      onUserCreated(data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdUser) return;
    
    const text = `Zugangsdaten für ${createdUser.user.firstName} ${createdUser.user.lastName}:\n\nE-Mail: ${createdUser.user.email}\nPasswort: ${createdUser.tempPassword}\n\nBitte ändern Sie das Passwort nach dem ersten Login.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setError(null);
    setCreatedUser(null);
    setCopied(false);
    onOpenChange(false);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Show success screen with credentials
  if (createdUser) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              Benutzer erstellt
            </DialogTitle>
            <DialogDescription>
              Der Benutzer wurde erfolgreich angelegt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p className="font-medium">
                  {createdUser.user.firstName} {createdUser.user.lastName}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">E-Mail:</span>
                <p className="font-medium font-mono">{createdUser.user.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Temporäres Passwort:
                </span>
                <p className="font-medium font-mono text-lg">
                  {createdUser.tempPassword}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Teilen Sie diese Zugangsdaten sicher mit dem Benutzer. Das
                Passwort sollte nach dem ersten Login geändert werden.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCopyCredentials}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Zugangsdaten kopieren
                </>
              )}
            </Button>
            <Button onClick={handleClose}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Neuen Benutzer anlegen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie einen neuen Benutzer mit den gewünschten Rollen. Ein
            temporäres Passwort wird automatisch generiert.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Rollen *</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAthlete"
                  checked={formData.isAthlete}
                  onCheckedChange={(checked) =>
                    updateField('isAthlete', checked === true)
                  }
                />
                <Label htmlFor="isAthlete" className="cursor-pointer">
                  Athlet/in
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTrainer"
                  checked={formData.isTrainer}
                  onCheckedChange={(checked) => {
                    updateField('isTrainer', checked === true);
                    // Reset to TRAINER role when unchecking
                    if (!checked) {
                      updateField('trainerRole', 'TRAINER');
                    }
                  }}
                />
                <Label htmlFor="isTrainer" className="cursor-pointer">
                  Trainer/in
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={formData.isTrainer && formData.trainerRole === 'ADMIN'}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // Enable trainer role and set as admin
                      updateField('isTrainer', true);
                      updateField('trainerRole', 'ADMIN');
                    } else {
                      // Keep trainer but demote to regular trainer
                      updateField('trainerRole', 'TRAINER');
                    }
                  }}
                />
                <Label htmlFor="isAdmin" className="cursor-pointer">
                  Administrator
                </Label>
              </div>
            </div>
            {!formData.isAthlete && !formData.isTrainer && (
              <p className="text-sm text-destructive">
                Mindestens eine Rolle erforderlich
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Persönliche Daten</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Geburtsdatum</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => updateField('birthDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Geschlecht</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEMALE">Weiblich</SelectItem>
                    <SelectItem value="MALE">Männlich</SelectItem>
                    <SelectItem value="OTHER">Divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Athlete-specific fields */}
          {formData.isAthlete && (
            <div className="space-y-4 pt-2 border-t">
              <Label className="text-base font-semibold">Athleten-Daten</Label>
              
              <p className="text-sm text-muted-foreground">
                Die Jugendkategorie (AK) wird automatisch anhand des Geburtsdatums berechnet.
              </p>

              <Label className="text-sm font-medium text-muted-foreground">
                Erziehungsberechtigte (für Minderjährige)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Name</Label>
                  <Input
                    id="guardianName"
                    value={formData.guardianName}
                    onChange={(e) => updateField('guardianName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianEmail">E-Mail</Label>
                  <Input
                    id="guardianEmail"
                    type="email"
                    value={formData.guardianEmail}
                    onChange={(e) => updateField('guardianEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">Telefon</Label>
                  <Input
                    id="guardianPhone"
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={(e) => updateField('guardianPhone', e.target.value)}
                  />
                </div>
              </div>

              <Label className="text-sm font-medium text-muted-foreground">
                Notfallkontakt
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      updateField('emergencyContactName', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Telefon</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      updateField('emergencyContactPhone', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || (!formData.isAthlete && !formData.isTrainer)
              }
            >
              {isSubmitting ? 'Wird erstellt...' : 'Benutzer erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
