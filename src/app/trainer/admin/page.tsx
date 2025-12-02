'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Bandage,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    color: 'text-green-500',
  },
  {
    title: 'Wettkämpfe',
    description: 'Wettkämpfe erstellen und Anmeldungen verwalten',
    href: '/trainer/admin/competitions',
    icon: Trophy,
    color: 'text-yellow-500',
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
    color: 'text-orange-500',
  },
  {
    title: 'Abwesenheitszeiten',
    description: 'Verletzungs- und Urlaubszeiten verwalten',
    href: '/trainer/admin/absence-periods',
    icon: Bandage,
    color: 'text-pink-500',
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Systemverwaltung und Konfiguration
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Icon className={cn('h-8 w-8', section.color)} />
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
