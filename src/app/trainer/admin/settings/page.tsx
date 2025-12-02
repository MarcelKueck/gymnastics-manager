'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/shared';
import { 
  Clock,
  Calendar,
  Save,
  CheckCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SystemSettings {
  id: string;
  cancellationDeadlineHours: number;
  sessionGenerationDaysAhead: number;
  absenceAlertThreshold: number;
  absenceAlertWindowDays: number;
  absenceAlertCooldownDays: number;
  absenceAlertEnabled: boolean;
  attendanceConfirmationMode: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        setSettings(result.data);
      } catch {
        setError('Fehler beim Laden der Einstellungen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      setSuccessMessage('Einstellungen erfolgreich gespeichert');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Fehler beim Speichern der Einstellungen');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Systemeinstellungen"
        description="Allgemeine Systemkonfiguration"
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Absagefrist</CardTitle>
            </div>
            <CardDescription>
              Wie viele Stunden vor dem Training kann ein Athlet noch absagen?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="cancellationDeadline">Stunden vor Training</Label>
              <Input
                id="cancellationDeadline"
                type="number"
                min={0}
                max={48}
                value={settings?.cancellationDeadlineHours ?? 2}
                onChange={(e) =>
                  setSettings(settings ? {
                    ...settings,
                    cancellationDeadlineHours: parseInt(e.target.value) || 0,
                  } : null)
                }
              />
              <p className="text-sm text-muted-foreground">
                Absagen innerhalb dieser Frist werden als unentschuldigt gewertet.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Teilnahmebestätigung</CardTitle>
            </div>
            <CardDescription>
              Wie sollen Athleten und Trainer ihre Teilnahme an Trainings bestätigen?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="attendanceMode">Bestätigungsmodus</Label>
              <Select
                value={settings?.attendanceConfirmationMode ?? 'AUTO_CONFIRM'}
                onValueChange={(value) =>
                  setSettings(settings ? {
                    ...settings,
                    attendanceConfirmationMode: value,
                  } : null)
                }
              >
                <SelectTrigger id="attendanceMode">
                  <SelectValue placeholder="Modus auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTO_CONFIRM">
                    Automatisch bestätigt (Absage erforderlich)
                  </SelectItem>
                  <SelectItem value="REQUIRE_CONFIRMATION">
                    Aktive Bestätigung erforderlich
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {settings?.attendanceConfirmationMode === 'REQUIRE_CONFIRMATION'
                  ? 'Athleten und Trainer müssen jede Trainingseinheit aktiv bestätigen.'
                  : 'Athleten und Trainer sind automatisch als teilnehmend markiert und müssen nur bei Abwesenheit absagen.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Session-Generierung</CardTitle>
            </div>
            <CardDescription>
              Wie viele Tage im Voraus sollen Sessions generiert werden?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="sessionGeneration">Tage im Voraus</Label>
              <Input
                id="sessionGeneration"
                type="number"
                min={7}
                max={365}
                value={settings?.sessionGenerationDaysAhead ?? 56}
                onChange={(e) =>
                  setSettings(settings ? {
                    ...settings,
                    sessionGenerationDaysAhead: parseInt(e.target.value) || 56,
                  } : null)
                }
              />
              <p className="text-sm text-muted-foreground">
                Sessions werden automatisch aus den wiederkehrenden Trainings generiert.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Absence Alert Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Abwesenheitswarnungen</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="absenceAlertEnabled" className="text-sm">
                {settings?.absenceAlertEnabled ? 'Aktiviert' : 'Deaktiviert'}
              </Label>
              <Switch
                id="absenceAlertEnabled"
                checked={settings?.absenceAlertEnabled ?? true}
                onCheckedChange={(checked: boolean) =>
                  setSettings(settings ? {
                    ...settings,
                    absenceAlertEnabled: checked,
                  } : null)
                }
              />
            </div>
          </div>
          <CardDescription>
            Konfigurieren Sie, wann Warnungen bei gehäuften Abwesenheiten ausgelöst werden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="absenceThreshold">Schwellenwert</Label>
              <Input
                id="absenceThreshold"
                type="number"
                min={1}
                max={20}
                value={settings?.absenceAlertThreshold ?? 3}
                onChange={(e) =>
                  setSettings(settings ? {
                    ...settings,
                    absenceAlertThreshold: parseInt(e.target.value) || 3,
                  } : null)
                }
                disabled={!settings?.absenceAlertEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Anzahl unentschuldigter Abwesenheiten, ab der eine Warnung ausgelöst wird
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="absenceWindow">Zeitraum (Tage)</Label>
              <Input
                id="absenceWindow"
                type="number"
                min={7}
                max={365}
                value={settings?.absenceAlertWindowDays ?? 30}
                onChange={(e) =>
                  setSettings(settings ? {
                    ...settings,
                    absenceAlertWindowDays: parseInt(e.target.value) || 30,
                  } : null)
                }
                disabled={!settings?.absenceAlertEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Betrachtungszeitraum für die Abwesenheitszählung
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="absenceCooldown">Abklingzeit (Tage)</Label>
              <Input
                id="absenceCooldown"
                type="number"
                min={1}
                max={90}
                value={settings?.absenceAlertCooldownDays ?? 14}
                onChange={(e) =>
                  setSettings(settings ? {
                    ...settings,
                    absenceAlertCooldownDays: parseInt(e.target.value) || 14,
                  } : null)
                }
                disabled={!settings?.absenceAlertEnabled}
              />
              <p className="text-sm text-muted-foreground">
                Wartezeit zwischen Warnungen für denselben Athleten
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
}
