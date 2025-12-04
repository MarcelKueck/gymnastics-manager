'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  FileText,
  User,
  Menu,
  LogOut,
  Shield,
  History,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/trainer/dashboard', icon: LayoutDashboard },
  { label: 'Trainings', href: '/trainer/sessions', icon: Calendar },
  { label: 'Athleten', href: '/trainer/athletes', icon: Users },
  { label: 'Statistiken', href: '/trainer/statistics', icon: BarChart3 },
  { label: 'Dateien', href: '/trainer/files', icon: FileText },
  { label: 'Verlauf', href: '/trainer/history', icon: History },
  { label: 'Profil', href: '/trainer/profile', icon: User },
  { label: 'Admin', href: '/trainer/admin', icon: Shield, adminOnly: true },
];

interface TrainerNavigationProps {
  user: {
    name?: string | null;
    email?: string | null;
    roles?: string[];
    activeRole?: string;
  };
}

export function TrainerNavigation({ user }: TrainerNavigationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const isAdmin = user.activeRole === 'ADMIN';

  const fetchPendingCount = () => {
    fetch('/api/trainer/athletes?status=pending')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setPendingCount(data.data.length);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Fetch pending approvals count on mount
    fetchPendingCount();

    // Listen for custom event to refetch pending count
    const handlePendingUpdate = () => fetchPendingCount();
    window.addEventListener('pending-athletes-updated', handlePendingUpdate);
    
    return () => {
      window.removeEventListener('pending-athletes-updated', handlePendingUpdate);
    };
  }, []);

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={cn('flex gap-1', mobile ? 'flex-col' : 'items-center')}>
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        const showBadge = item.href === '/trainer/athletes' && pendingCount > 0;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setOpen(false)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative touch-manipulation',
              mobile ? 'min-h-[44px]' : '',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
            {showBadge && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {pendingCount}
              </Badge>
            )}
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
                <Badge variant="outline" className="mt-1.5">
                  {isAdmin ? 'Administrator' : 'Trainer'}
                </Badge>
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
        <Link href="/trainer/dashboard" className="font-semibold mr-6 flex items-center gap-2">
          SV Esting Turnen
          <Badge variant="outline" className="hidden sm:inline-flex">
            {isAdmin ? 'Admin' : 'Trainer'}
          </Badge>
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
