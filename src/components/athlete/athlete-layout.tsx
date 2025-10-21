'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, X, LayoutDashboard, Calendar, ClipboardList, UserCircle, LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/athlete/dashboard', icon: LayoutDashboard },
  { name: 'Trainingstermine', href: '/athlete/schedule', icon: Calendar },
  { name: 'Dateien', href: '/athlete/files', icon: FileText },
  { name: 'Anwesenheit', href: '/athlete/attendance', icon: ClipboardList },
  { name: 'Profil', href: '/athlete/profile', icon: UserCircle },
];

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden text-white sv-esting-sidebar">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">Athletenportal</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md transition-colors sv-esting-nav-item"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="px-2 pb-3 space-y-1 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium sv-esting-nav-item ${
                    isActive ? 'sv-esting-nav-item-active' : ''
                  }`}
                  style={{ color: 'white' }}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium sv-esting-nav-item w-full"
              style={{ color: 'white' }}
            >
              <LogOut size={20} />
              Abmelden
            </button>
          </nav>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto sv-esting-sidebar">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-white">Athletenportal</h1>
          </div>
          <nav className="mt-8 flex-1 flex flex-col px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium sv-esting-nav-item ${
                    isActive ? 'sv-esting-nav-item-active' : ''
                  }`}
                  style={{ color: 'white' }}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="px-2">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full justify-start gap-3 bg-transparent border sv-esting-logout-btn"
              style={{ 
                color: 'white', 
                borderColor: 'rgba(255, 255, 255, 0.4)' 
              }}
            >
              <LogOut size={20} />
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}