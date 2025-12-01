'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, User, GraduationCap, Shield } from 'lucide-react';

const ROLE_LABELS = {
  ATHLETE: 'Athlet',
  TRAINER: 'Trainer',
  ADMIN: 'Administrator',
} as const;

const ROLE_ICONS = {
  ATHLETE: User,
  TRAINER: GraduationCap,
  ADMIN: Shield,
} as const;

const ROLE_ROUTES = {
  ATHLETE: '/athlete/dashboard',
  TRAINER: '/trainer/dashboard',
  ADMIN: '/trainer/dashboard',
} as const;

export function RoleSwitcher() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (!session || session.user.roles.length <= 1) {
    return null;
  }

  const handleRoleSwitch = async (role: 'ATHLETE' | 'TRAINER' | 'ADMIN') => {
    if (role === session.user.activeRole) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        // Update session with new active role
        await update({ activeRole: role });
        // Hard reload to ensure all server components (including layout/header) refresh
        window.location.href = ROLE_ROUTES[role];
      } else {
        console.error('Role switch failed:', await response.text());
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Role switch failed:', error);
      setIsLoading(false);
    }
  };

  const ActiveIcon = ROLE_ICONS[session.user.activeRole];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <ActiveIcon className="h-4 w-4 mr-2" />
          {ROLE_LABELS[session.user.activeRole]}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {session.user.roles.map((role) => {
          const Icon = ROLE_ICONS[role];
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={role === session.user.activeRole ? 'bg-accent' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {ROLE_LABELS[role]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
