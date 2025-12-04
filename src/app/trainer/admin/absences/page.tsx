'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared';
import {
  AlertTriangle,
  Check,
  User,
  Calendar,
  Bell,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';

interface AbsenceAlert {
  id: string;
  absenceCount: number;
  period: number;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  athlete: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface CalculatedWarning {
  athleteId: string;
  absenceCount: number;
  period: number;
  athlete: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface AbsenceSettings {
  threshold: number;
  windowDays: number;
  cooldownDays: number;
  isEnabled: boolean;
}

export default function AdminAbsencesPage() {
  const [alerts, setAlerts] = useState<AbsenceAlert[]>([]);
  const [calculatedWarnings, setCalculatedWarnings] = useState<CalculatedWarning[]>([]);
  const [settings, setSettings] = useState<AbsenceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/trainer/alerts');
      if (res.ok) {
        const result = await res.json();
        setAlerts(result.data || []);
        setCalculatedWarnings(result.calculatedWarnings || []);
        setSettings(result.settings || null);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledging(alertId);
    try {
      const res = await fetch(`/api/trainer/alerts/${alertId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      } else {
        const result = await res.json();
        alert(result.error || 'Fehler beim Bestätigen');
      }
    } catch (error) {
      console.error('Acknowledge error:', error);
      alert('Fehler beim Bestätigen');
    } finally {
      setAcknowledging(null);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abwesenheitswarnungen"
        description="Athleten mit auffällig vielen unentschuldigten Abwesenheiten"
      />

      {/* Current Settings Card */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Aktuelle Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {settings.isEnabled ? (
                    <Badge variant="default">Aktiviert</Badge>
                  ) : (
                    <Badge variant="secondary">Deaktiviert</Badge>
                  )}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Schwellenwert</p>
                <p className="font-medium">{settings.threshold} Abwesenheiten</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Zeitraum</p>
                <p className="font-medium">{settings.windowDays} Tage</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Abklingzeit</p>
                <p className="font-medium">{settings.cooldownDays} Tage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Einstellungen können unter{' '}
              <Link href="/trainer/admin/settings" className="font-medium text-primary hover:underline">
                Administration → Einstellungen
              </Link>{' '}
              angepasst werden.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Calculated Warnings (Real-time) */}
      {calculatedWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Aktuelle Auffälligkeiten
            </CardTitle>
            <CardDescription>
              {calculatedWarnings.length} Athlet(en) mit erhöhten Abwesenheiten (in Echtzeit berechnet)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculatedWarnings.map((warning) => (
                <div
                  key={warning.athleteId}
                  className="flex items-center justify-between p-4 rounded-lg border bg-amber-50 border-amber-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <User className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {warning.athlete.user.firstName} {warning.athlete.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {warning.athlete.user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="destructive">
                          {warning.absenceCount} unentschuldigte Abwesenheiten
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          in den letzten {warning.period} Tagen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stored Alerts (to be acknowledged) */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Offene Warnungen zur Bestätigung
            </CardTitle>
            <CardDescription>
              {alerts.length} gespeicherte Warnung(en) erfordern Ihre Aufmerksamkeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                      <User className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {alert.athlete.user.firstName} {alert.athlete.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alert.athlete.user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="destructive">
                          {alert.absenceCount} unentschuldigte Abwesenheiten
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          in den letzten {alert.period} Tagen
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(alert.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledging === alert.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {acknowledging === alert.id ? 'Wird bestätigt...' : 'Bestätigen'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {alerts.length === 0 && calculatedWarnings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Auffälligkeiten</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Aktuell gibt es keine Athleten mit auffällig vielen unentschuldigten
              Abwesenheiten im konfigurierten Zeitraum.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
