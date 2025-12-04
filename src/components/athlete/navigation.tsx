'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import {
  LayoutDashboard,
  Calendar,
  User,
  Trophy,
  FileText,
  History,
  Menu,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/athlete/dashboard', icon: LayoutDashboard },
  { label: 'Trainings', href: '/athlete/schedule', icon: Calendar },
  { label: 'Profil', href: '/athlete/profile', icon: User },
  { label: 'Wettkämpfe', href: '/athlete/competitions', icon: Trophy },
  { label: 'Dateien', href: '/athlete/files', icon: FileText },
  { label: 'Verlauf', href: '/athlete/history', icon: History },
];

interface AthleteNavigationProps {
  user: {
    name?: string | null;
    email?: string | null;
    roles?: string[];
  };
}

export function AthleteNavigation({ user }: AthleteNavigationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn('flex gap-1', mobile ? 'flex-col' : 'items-center')}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setOpen(false)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation',
              mobile ? 'min-h-[44px]' : '',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2 h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menü öffnen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <div className="font-semibold text-lg">SV Esting Turnen</div>
                <div className="text-sm text-muted-foreground mt-0.5">{user.name || user.email}</div>
              </div>
              <div className="flex-1 p-3 overflow-y-auto">
                <NavLinks mobile />
              </div>
              <div className="p-3 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-11"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="h-5 w-5 mr-2.5" />
                  Abmelden
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/athlete/dashboard" className="font-semibold mr-6">
          SV Esting Turnen
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex flex-1">
          <NavLinks />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          <RoleSwitcher />
          <div className="hidden sm:block text-sm text-muted-foreground">
            {user.name || user.email}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="hidden md:flex h-10 w-10"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Abmelden</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
