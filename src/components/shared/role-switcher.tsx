'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserRole } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Users, User, ShieldCheck, ChevronDown } from 'lucide-react';

export function RoleSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Only show for users with multiple roles
  if (!session?.user || session.user.roles.length <= 1) {
    return null;
  }

  const currentRole = session.user.activeRole;
  const availableRoles = session.user.roles;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ATHLETE':
        return 'Athlet';
      case 'TRAINER':
        return 'Trainer';
      case 'ADMIN':
        return 'Admin';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ATHLETE':
        return <User className="h-4 w-4" />;
      case 'TRAINER':
        return <Users className="h-4 w-4" />;
      case 'ADMIN':
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleRoleSwitch = async (targetRole: UserRole) => {
    if (targetRole === currentRole) return;

    setIsLoading(true);
    try {
      // Call API to validate role switch
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch role');
      }

      // Update session with new active role
      await update({ activeRole: targetRole });

      // Redirect to appropriate dashboard
      if (targetRole === 'ATHLETE') {
        router.push('/athlete/dashboard');
      } else if (targetRole === 'TRAINER' || targetRole === 'ADMIN') {
        router.push('/trainer/dashboard');
      }

      router.refresh();
    } catch (error) {
      console.error('Error switching role:', error);
      alert('Fehler beim Rollenwechsel. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          disabled={isLoading}
        >
          {getRoleIcon(currentRole)}
          <span className="hidden sm:inline">{getRoleLabel(currentRole)}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Rolle wechseln
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleRoleSwitch(role)}
            disabled={isLoading || role === currentRole}
            className="gap-2 cursor-pointer"
          >
            {getRoleIcon(role)}
            <span>{getRoleLabel(role)}</span>
            {role === currentRole && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
