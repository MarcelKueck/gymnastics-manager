'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  User,
  ClipboardList,
  FileText,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

const navigation = [
  { name: 'Übersicht', href: '/athlete/dashboard', icon: LayoutDashboard },
  { name: 'Nächste Termine', href: '/athlete/schedule', icon: Calendar },
  { name: 'Mein Profil', href: '/athlete/profile', icon: User },
  { name: 'Anwesenheit', href: '/athlete/attendance', icon: ClipboardList },
  { name: 'Trainingspläne', href: '/athlete/training-plans', icon: FileText },
];

interface AthleteLayoutProps {
  children: ReactNode;
}

export default function AthleteLayout({ children }: AthleteLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-teal-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 bg-teal-800">
            <h1 className="text-xl font-bold text-white">Athletenportal</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-teal-800 text-white'
                      : 'text-teal-100 hover:bg-teal-600 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-teal-600 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || 'Athlet'}
                </p>
                <p className="text-xs text-teal-200 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-600 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find((item) => item.href === pathname)?.name || 'Athletenportal'}
            </h2>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}