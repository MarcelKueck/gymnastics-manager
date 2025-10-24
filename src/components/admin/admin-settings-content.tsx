'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  AlertCircle,
  Settings as SettingsIcon,
  Users,
  UserX,
  Bell,
  Clock,
  Mail,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface SystemSettings {
  cancellationDeadlineHours: number;
  absenceAlertThreshold: number;
  absenceAlertWindowDays: number;
  absenceAlertCooldownDays: number;
  adminNotificationEmail: string;
  absenceAlertEnabled: boolean;
  maxUploadSizeMB: number;
  sessionGenerationDaysAhead: number;
}

interface AthleteWithAbsences {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  absenceCount: number;
  lastAlertDate?: string;
  recentAbsences: Array<{
    date: string;
    trainingName: string;
  }>;
}

export function AdminSettingsContent() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [athletesWithAbsences, setAthletesWithAbsences] = useState<AthleteWithAbsences[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, absencesRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/absences/alerts'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.data);
      }

      if (absencesRes.ok) {
        const data = await absencesRes.json();
        setAthletesWithAbsences(data.data);
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error();

      toast.success('Einstellungen erfolgreich gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAbsences = async (athleteId: string, athleteName: string) => {
    if (
      !confirm(
        `Möchtest du die Fehlzeiten für ${athleteName} wirklich zurücksetzen? Dies löscht alle aufgezeichneten Fehlzeiten-Warnungen.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/athletes/${athleteId}/absences`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error();

      toast.success(`Fehlzeiten für ${athleteName} zurückgesetzt`);
      fetchData();
    } catch (error) {
      toast.error('Fehler beim Zurücksetzen der Fehlzeiten');
    }
  };

  const handleRemoveAthlete = async (athleteId: string, athleteName: string) => {
    if (
      !confirm(
        `ACHTUNG: Möchtest du ${athleteName} wirklich komplett aus dem System entfernen?\n\nDies wird:\n- Den Athleten-Account löschen\n- Alle Trainingszuweisungen entfernen\n- Alle Anwesenheitsaufzeichnungen löschen\n- Eine Benachrichtigungs-E-Mail an ${athleteName} senden\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/athletes/${athleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Entfernen');
      }

      toast.success(`${athleteName} wurde erfolgreich aus dem System entfernt und per E-Mail benachrichtigt`);
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Entfernen des Athleten');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Systemverwaltung</h1>
        <p className="text-muted-foreground">
          Verwalte Systemeinstellungen, Fehlzeiten und Benutzer
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="absences">
            <Bell className="h-4 w-4 mr-2" />
            Fehlzeiten-Verwaltung
            {athletesWithAbsences.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {athletesWithAbsences.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {settings && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Absage-Einstellungen
                  </CardTitle>
                  <CardDescription>
                    Lege fest, wie lange im Voraus Athleten ihre Trainingseinheiten absagen können
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cancellationDeadline">
                      Absagefrist (Stunden vor Trainingsbeginn)
                    </Label>
                    <Input
                      id="cancellationDeadline"
                      type="number"
                      min="0"
                      max="48"
                      value={settings.cancellationDeadlineHours}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          cancellationDeadlineHours: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Athleten können Trainings bis zu {settings.cancellationDeadlineHours} Stunden
                      vor Beginn absagen
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Fehlzeiten-Benachrichtigungen
                  </CardTitle>
                  <CardDescription>
                    Automatische E-Mail-Benachrichtigungen bei unentschuldigten Fehlzeiten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="absenceThreshold">
                      Schwellenwert (Anzahl unentschuldigter Fehlzeiten)
                    </Label>
                    <Input
                      id="absenceThreshold"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.absenceAlertThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          absenceAlertThreshold: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Warnung wird ausgelöst bei {settings.absenceAlertThreshold} unentschuldigten
                      Fehlzeiten
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="absenceWindow">Zeitfenster (Tage)</Label>
                    <Input
                      id="absenceWindow"
                      type="number"
                      min="7"
                      max="90"
                      value={settings.absenceAlertWindowDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          absenceAlertWindowDays: parseInt(e.target.value) || 7,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Fehlzeiten werden in den letzten {settings.absenceAlertWindowDays} Tagen
                      gezählt
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="absenceCooldown">
                      Cooldown-Periode (Tage zwischen Benachrichtigungen)
                    </Label>
                    <Input
                      id="absenceCooldown"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.absenceAlertCooldownDays}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          absenceAlertCooldownDays: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Mindestens {settings.absenceAlertCooldownDays} Tage zwischen Warnungen für
                      denselben Athleten
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Admin-Benachrichtigungs-E-Mail
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={settings.adminNotificationEmail}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          adminNotificationEmail: e.target.value,
                        })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Kopie aller Fehlzeiten-Warnungen wird an diese Adresse gesendet
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableAlerts"
                      checked={settings.absenceAlertEnabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          absenceAlertEnabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="enableAlerts" className="cursor-pointer">
                      Fehlzeiten-Benachrichtigungen aktivieren
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weitere Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUploadSize">Maximale Upload-Größe (MB)</Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      min="1"
                      max="100"
                      value={settings.maxUploadSizeMB}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maxUploadSizeMB: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionGeneration">
                      Trainingseinheiten im Voraus generieren (Tage)
                    </Label>
                    <Input
                      id="sessionGeneration"
                      type="number"
                      min="30"
                      max="365"
                      value={settings.sessionGenerationDaysAhead}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sessionGenerationDaysAhead: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveSettings} disabled={isSaving} size="lg">
                {isSaving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="absences" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hier werden Athleten angezeigt, die den Schwellenwert für unentschuldigte Fehlzeiten
              überschritten haben. Du kannst ihre Fehlzeiten zurücksetzen oder sie komplett aus dem
              System entfernen.
            </AlertDescription>
          </Alert>

          {athletesWithAbsences.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Keine Fehlzeiten-Warnungen</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Alle Athleten haben ihre Trainingseinheiten ordnungsgemäß abgesagt
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {athletesWithAbsences.map((athlete) => (
                <Card key={athlete.id} className="border-l-4 border-l-destructive">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          {athlete.firstName} {athlete.lastName}
                          <Badge variant="destructive" className="ml-3">
                            {athlete.absenceCount} Fehlzeiten
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <Mail className="h-4 w-4 inline mr-1" />
                          {athlete.email}
                        </CardDescription>
                        {athlete.lastAlertDate && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Letzte Warnung: {new Date(athlete.lastAlertDate).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleResetAbsences(
                              athlete.id,
                              `${athlete.firstName} ${athlete.lastName}`
                            )
                          }
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Zurücksetzen
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveAthlete(
                              athlete.id,
                              `${athlete.firstName} ${athlete.lastName}`
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Entfernen
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {athlete.recentAbsences && athlete.recentAbsences.length > 0 && (
                    <CardContent>
                      <p className="text-sm font-medium mb-2">Betroffene Trainingseinheiten:</p>
                      <ul className="text-sm space-y-1">
                        {athlete.recentAbsences.map((absence, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {absence.trainingName} -{' '}
                            {new Date(absence.date).toLocaleDateString('de-DE')}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
