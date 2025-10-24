'use client';

import React, { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';

interface TrainerLayoutProps {
  children: React.ReactNode;
  userName: string;
  isAdmin: boolean;
}

export function TrainerLayout({ children, userName, isAdmin }: TrainerLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-top">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center min-w-0">
              <h1 className="text-sm md:text-xl font-bold text-primary truncate">
                SV Esting Turnen
                <span className="hidden lg:inline"> - Trainer Portal</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <span className="text-xs md:text-sm text-gray-700 truncate max-w-[100px] md:max-w-none">
                {userName.split(' ')[0]} {isAdmin && <span className="text-primary">(Admin)</span>}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="hidden md:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-200 ease-in-out overflow-y-auto md:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-3 space-y-1 safe-bottom">
          {/* Main Navigation */}
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors touch-target',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
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
                    onClick={closeMobileMenu}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors touch-target',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full justify-start px-4 py-3 touch-target mt-4"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Abmelden
          </Button>
        </nav>
      </aside>

      <div className="md:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
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
        <main className="flex-1 p-4 md:p-6 lg:p-8 safe-bottom">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-bottom">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors touch-target',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 active:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium truncate max-w-full">
                  {item.name.split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}