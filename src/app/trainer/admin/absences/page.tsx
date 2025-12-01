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
import {
  AlertTriangle,
  Check,
  User,
  Calendar,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

export default function AdminAbsencesPage() {
  const [alerts, setAlerts] = useState<AbsenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/trainer/alerts');
      if (res.ok) {
        const result = await res.json();
        setAlerts(result.data || []);
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
        // Remove from list
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
      <div>
        <h1 className="text-2xl font-bold">Abwesenheitswarnungen</h1>
        <p className="text-muted-foreground">
          Athleten mit auffällig vielen unentschuldigten Abwesenheiten
        </p>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine offenen Warnungen</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Alle Warnungen wurden bereits bearbeitet oder es gibt aktuell keine
              Athleten mit auffällig vielen Abwesenheiten.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Offene Warnungen
            </CardTitle>
            <CardDescription>
              {alerts.length} Warnung(en) erfordern Ihre Aufmerksamkeit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-amber-50 border-amber-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                      <User className="h-5 w-5 text-amber-700" />
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

      {/* Info Card about settings */}
      <Card>
        <CardHeader>
          <CardTitle>Warnungseinstellungen</CardTitle>
          <CardDescription>
            Die Konfiguration erfolgt in den Systemeinstellungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Warnungen werden automatisch generiert, wenn ein Athlet die konfigurierte
            Anzahl an unentschuldigten Abwesenheiten innerhalb des festgelegten
            Zeitraums überschreitet. Die Einstellungen können unter{' '}
            <span className="font-medium">Administration → Einstellungen</span> angepasst werden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
