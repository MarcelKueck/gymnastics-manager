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
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex flex-col gap-4">
              <div className="font-semibold">SV Esting Turnen</div>
              <NavLinks mobile />
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
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
        <div className="flex items-center gap-4 ml-auto">
          <RoleSwitcher />
          <div className="hidden sm:block text-sm text-muted-foreground">
            {user.name || user.email}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="hidden md:flex"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Abmelden</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
