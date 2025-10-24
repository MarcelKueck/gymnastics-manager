'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Users,
  Calendar,
  BarChart3,
  FileText,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

interface TrainerLayoutProps {
  children: React.ReactNode;
  userName: string;
  isAdmin: boolean;
}

export function TrainerLayout({ children, userName, isAdmin }: TrainerLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/trainer/dashboard', icon: Home },
    // Only show Athletes link for regular trainers, admins use "Benutzer verwalten"
    ...(isAdmin ? [] : [{ name: 'Athleten', href: '/trainer/athletes', icon: Users }]),
    { name: 'Trainingseinheiten', href: '/trainer/sessions', icon: Calendar },
    { name: 'Statistiken', href: '/trainer/statistics', icon: BarChart3 },
    { name: 'Dateien', href: '/trainer/files', icon: FileText },
    { name: 'Profil', href: '/trainer/profile', icon: User },
  ];

  const adminNavigation = isAdmin
    ? [
        { name: 'Trainings verwalten', href: '/trainer/admin/trainings', icon: Calendar },
        { name: 'Gruppen verwalten', href: '/trainer/admin/groups', icon: Users },
        { name: 'Benutzer verwalten', href: '/trainer/admin/users', icon: Users },
        { name: 'Kategorien', href: '/trainer/admin/categories', icon: FileText },
        { name: 'Trainer-Stunden', href: '/trainer/admin/hours', icon: BarChart3 },
        { name: 'Systemeinstellungen', href: '/trainer/admin/settings', icon: Settings },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">
                SV Esting Turnen - Trainer Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {userName} {isAdmin && <span className="text-primary">(Admin)</span>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {/* Main Navigation */}
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Navigation */}
            {adminNavigation.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </h3>
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}