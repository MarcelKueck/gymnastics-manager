'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Settings, 
  Clock,
  FolderOpen,
  AlertTriangle,
  ChevronRight,
  Mail,
  UserPlus,
  UserCheck,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminDashboardData {
  users: {
    totalAthletes: number;
    pendingAthletes: number;
    activeAthletes: number;
    inactiveAthletes: number;
    totalTrainers: number;
    activeTrainers: number;
  };
  trainings: {
    activeTrainings: number;
    totalGroups: number;
  };
  competitions: {
    upcoming: {
      id: string;
      name: string;
      date: string;
      location: string | null;
      registrations: number;
      registrationDeadline: string | null;
    }[];
    totalRegistrations: number;
  };
  recentActivity: {
    newAthletes: {
      id: string;
      name: string;
      status: string;
      createdAt: string;
    }[];
    absenceAlerts: {
      id: string;
      athleteName: string;
      sentAt: string;
      acknowledged: boolean;
    }[];
  };
  attendanceSummary: {
    present: number;
    absentUnexcused: number;
    absentExcused: number;
  };
  recentFiles: number;
}

const adminSections = [
  {
    title: 'Trainings verwalten',
    description: 'Regelmäßige Trainings und Gruppen konfigurieren',
    href: '/trainer/admin/trainings',
    icon: Calendar,
    color: 'text-blue-500',
  },
  {
    title: 'Benutzer verwalten',
    description: 'Athleten und Trainer verwalten',
    href: '/trainer/admin/users',
    icon: Users,
    color: 'text-emerald-500',
  },
  {
    title: 'Wettkämpfe',
    description: 'Wettkämpfe erstellen und Anmeldungen verwalten',
    href: '/trainer/admin/competitions',
    icon: Trophy,
    color: 'text-amber-500',
  },
  {
    title: 'Trainerstunden',
    description: 'Trainerstunden erfassen und auswerten',
    href: '/trainer/admin/hours',
    icon: Clock,
    color: 'text-purple-500',
  },
  {
    title: 'Dateikategorien',
    description: 'Kategorien für Dateien verwalten',
    href: '/trainer/admin/file-categories',
    icon: FolderOpen,
    color: 'text-amber-500',
  },
  {
    title: 'Abwesenheitswarnungen',
    description: 'Automatische Warnungen konfigurieren',
    href: '/trainer/admin/absences',
    icon: AlertTriangle,
    color: 'text-red-500',
  },
  {
    title: 'E-Mails',
    description: 'E-Mails an Athleten und Trainer senden',
    href: '/trainer/admin/bulk-email',
    icon: Mail,
    color: 'text-cyan-500',
  },
  {
    title: 'Systemeinstellungen',
    description: 'Allgemeine Systemkonfiguration',
    href: '/trainer/admin/settings',
    icon: Settings,
    color: 'text-gray-500',
  },
];

export default function AdminPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (error) return (
    <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
      Fehler beim Laden: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Administration</h1>
        <p className="text-muted-foreground">
          Systemverwaltung und Konfiguration
        </p>
      </div>

      {/* System Overview Stats */}
      {data && (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Athleten
                </CardTitle>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{data.users.activeAthletes}</div>
                <p className="text-xs text-muted-foreground">
                  aktiv von {data.users.totalAthletes}
                </p>
                {data.users.pendingAthletes > 0 && (
                  <Badge variant="outline" className="mt-2 border-amber-500 text-amber-600 text-xs">
                    {data.users.pendingAthletes} ausstehend
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Trainer
                </CardTitle>
                <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{data.users.activeTrainers}</div>
                <p className="text-xs text-muted-foreground">
                  aktiv von {data.users.totalTrainers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Trainings
                </CardTitle>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{data.trainings.activeTrainings}</div>
                <p className="text-xs text-muted-foreground">
                  {data.trainings.totalGroups} Gruppen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Anwesenheit
                </CardTitle>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">
                  {data.attendanceSummary.present + data.attendanceSummary.absentUnexcused + data.attendanceSummary.absentExcused > 0
                    ? Math.round((data.attendanceSummary.present / (data.attendanceSummary.present + data.attendanceSummary.absentUnexcused + data.attendanceSummary.absentExcused)) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  diesen Monat
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Athletes */}
            {data.users.pendingAthletes > 0 && (
              <Card className="border-amber-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-amber-500" />
                    Ausstehende Freigaben
                  </CardTitle>
                  <CardDescription>
                    {data.users.pendingAthletes} Athleten warten auf Freigabe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.recentActivity.newAthletes
                      .filter(a => a.status === 'PENDING')
                      .slice(0, 3)
                      .map((athlete) => (
                        <div key={athlete.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="font-medium text-sm">{athlete.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(athlete.createdAt), 'dd.MM.yyyy')}
                          </span>
                        </div>
                      ))}
                  </div>
                  <Link href="/trainer/athletes?status=pending">
                    <Button className="w-full mt-4">
                      Alle anzeigen
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Competitions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Anstehende Wettkämpfe
                  </span>
                  <Link href="/trainer/admin/competitions">
                    <Button variant="ghost" size="sm" className="h-8">
                      Alle <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.competitions.upcoming.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Keine anstehenden Wettkämpfe
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.competitions.upcoming.map((comp) => (
                      <Link key={comp.id} href={`/trainer/admin/competitions/${comp.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium text-sm">{comp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(comp.date), 'dd.MM.yyyy', { locale: de })}
                              {comp.location && ` • ${comp.location}`}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {comp.registrations} Anmeldungen
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Absence Alerts */}
            {data.recentActivity.absenceAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Aktuelle Fehlzeiten-Warnungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.recentActivity.absenceAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <span className="font-medium text-sm">{alert.athleteName}</span>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(alert.sentAt), 'dd.MM.yyyy HH:mm')}
                          </p>
                        </div>
                        {alert.acknowledged ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Bestätigt
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Offen
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link href="/trainer/admin/absences">
                    <Button variant="outline" className="w-full mt-4">
                      Alle Warnungen verwalten
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-500" />
                  Aktivität (letzte 30 Tage)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Neue Athleten</span>
                    <span className="font-bold">{data.recentActivity.newAthletes.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fehlzeiten-Warnungen</span>
                    <span className="font-bold">{data.recentActivity.absenceAlerts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hochgeladene Dateien</span>
                    <span className="font-bold">{data.recentFiles}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wettkampf-Anmeldungen</span>
                    <span className="font-bold">{data.competitions.totalRegistrations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Admin Sections */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Verwaltungsbereiche</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Icon className={cn('h-6 w-6', section.color)} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription className="text-xs">{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
