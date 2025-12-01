'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Clock,
  Calendar,
  Save,
  CheckCircle,
} from 'lucide-react';

interface SystemSettings {
  id: string;
  cancellationDeadlineHours: number;
  sessionGenerationDaysAhead: number;
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
      <div>
        <h1 className="text-2xl font-bold">Systemeinstellungen</h1>
        <p className="text-muted-foreground">Allgemeine Systemkonfiguration</p>
      </div>

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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Speichere...' : 'Einstellungen speichern'}
        </Button>
      </div>
    </div>
  );
}
