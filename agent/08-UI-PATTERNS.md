# UI Patterns & Component Conventions

## Overview

This document defines UI patterns, component conventions, and styling guidelines for consistent implementation across the application.

## Technology Stack

| Tool         | Purpose                |
| ------------ | ---------------------- |
| Tailwind CSS | Utility-first styling  |
| shadcn/ui    | Base component library |
| Radix UI     | Accessible primitives  |
| Lucide React | Icons                  |
| sonner       | Toast notifications    |

## Component Structure

### File Organization

```
src/components/
├── ui/                    # Base shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── shared/               # Cross-role components
│   ├── role-switcher.tsx
│   ├── loading.tsx
│   ├── error-boundary.tsx
│   └── page-header.tsx
├── athlete/              # Athlete-specific
│   ├── navigation.tsx
│   ├── session-card.tsx
│   └── cancellation-dialog.tsx
├── trainer/              # Trainer-specific
│   ├── navigation.tsx
│   ├── attendance-dialog.tsx
│   └── athlete-list.tsx
└── admin/               # Admin-specific
    ├── training-form.tsx
    ├── group-manager.tsx
    └── settings-form.tsx
```

## Base UI Components

### Button

```typescript
import { Button } from '@/components/ui/button';

// Variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// With loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? 'Wird geladen...' : 'Speichern'}
</Button>
```

### Card

```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
    <CardDescription>Beschreibung</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Optional description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Abbrechen
      </Button>
      <Button onClick={handleSubmit}>Bestätigen</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Controls

```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Input with label
<div className="space-y-2">
  <Label htmlFor="email">E-Mail</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="email@beispiel.de"
  />
</div>

// Select
<div className="space-y-2">
  <Label>Kategorie</Label>
  <Select value={category} onValueChange={setCategory}>
    <SelectTrigger>
      <SelectValue placeholder="Kategorie wählen" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="F">F-Jugend</SelectItem>
      <SelectItem value="E">E-Jugend</SelectItem>
      <SelectItem value="D">D-Jugend</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## Shared Components

### Loading

```typescript
// src/components/ui/loading.tsx
import { Loader2 } from 'lucide-react';

export function Loading({ text = 'Wird geladen...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">{text}</span>
    </div>
  );
}

// Full page loading
export function PageLoading() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loading />
    </div>
  );
}
```

### Page Header

```typescript
// src/components/shared/page-header.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// Usage
<PageHeader
  title="Trainingseinheiten"
  description="Verwalte deine Trainings"
  actions={
    <Button onClick={() => setShowDialog(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Neu
    </Button>
  }
/>
```

### Empty State

```typescript
// src/components/shared/empty-state.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Usage
<EmptyState
  icon={<Calendar className="h-12 w-12" />}
  title="Keine Trainings"
  description="Es sind keine Trainings für diesen Tag geplant"
  action={<Button variant="outline">Training erstellen</Button>}
/>
```

### Badge

```typescript
import { Badge } from '@/components/ui/badge';

// Status badges
<Badge variant="default">Aktiv</Badge>
<Badge variant="secondary">Ausstehend</Badge>
<Badge variant="destructive">Abgesagt</Badge>
<Badge variant="outline">Info</Badge>

// Custom colored badges for attendance
const ATTENDANCE_BADGE_VARIANTS = {
  PRESENT: 'bg-green-100 text-green-800',
  ABSENT_EXCUSED: 'bg-yellow-100 text-yellow-800',
  ABSENT_UNEXCUSED: 'bg-red-100 text-red-800',
};
```

---

## Layout Patterns

### Dashboard Layout

```typescript
// Grid-based dashboard with stats cards
<div className="space-y-6">
  {/* Stats Row */}
  <div className="grid gap-4 md:grid-cols-3">
    <StatsCard title="Anwesenheit" value="85%" icon={Percent} />
    <StatsCard title="Trainings" value="12" icon={Calendar} />
    <StatsCard title="Absagen" value="2" icon={Ban} />
  </div>

  {/* Main Content */}
  <div className="grid gap-6 md:grid-cols-2">
    <Card>{/* Upcoming Sessions */}</Card>
    <Card>{/* Recent Activity */}</Card>
  </div>
</div>
```

### Stats Card Component

```typescript
// src/components/shared/stats-card.tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; positive: boolean };
}

export function StatsCard({ title, value, icon: Icon, description, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '+' : ''}{trend.value}% gegenüber letztem Monat
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Two-Column Layout

```typescript
// Sidebar + main content
<div className="grid gap-6 md:grid-cols-[300px_1fr]">
  {/* Sidebar */}
  <aside className="space-y-4">
    <Card>
      {/* Filters, calendar, etc. */}
    </Card>
  </aside>

  {/* Main Content */}
  <main className="space-y-4">
    {/* Content cards */}
  </main>
</div>
```

---

## Navigation Patterns

### Main Navigation Component

```typescript
// src/components/athlete/navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RoleSwitcher } from '@/components/shared/role-switcher';
import {
  LayoutDashboard,
  Calendar,
  Ban,
  User,
  Trophy,
  FileText,
  History,
} from 'lucide-react';

const navItems = [
  { href: '/athlete/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/athlete/schedule', label: 'Trainingsplan', icon: Calendar },
  { href: '/athlete/cancellations', label: 'Absagen', icon: Ban },
  { href: '/athlete/competitions', label: 'Wettkämpfe', icon: Trophy },
  { href: '/athlete/files', label: 'Dateien', icon: FileText },
  { href: '/athlete/history', label: 'Verlauf', icon: History },
  { href: '/athlete/profile', label: 'Profil', icon: User },
];

export function AthleteNavigation({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <nav className="flex items-center space-x-6">
          <Link href="/athlete/dashboard" className="font-bold">
            SV Esting
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <RoleSwitcher />
          <span className="text-sm text-muted-foreground">
            {user.firstName} {user.lastName}
          </span>
        </div>
      </div>
    </header>
  );
}
```

### Mobile-Responsive Navigation

```typescript
// Use Sheet component for mobile menu
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="flex flex-col space-y-4 mt-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Form Patterns

### Form with Validation Errors

```typescript
interface FormState {
  errors: Record<string, string[]>;
  isSubmitting: boolean;
}

export function TrainingForm() {
  const [formState, setFormState] = useState<FormState>({
    errors: {},
    isSubmitting: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState({ ...formState, isSubmitting: true, errors: {} });

    try {
      const response = await fetch('/api/admin/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details?.fieldErrors) {
          setFormState({
            ...formState,
            errors: data.details.fieldErrors,
            isSubmitting: false,
          });
        } else {
          toast.error(data.error);
          setFormState({ ...formState, isSubmitting: false });
        }
        return;
      }

      toast.success('Erfolgreich gespeichert');
      // Reset or redirect
    } catch (error) {
      toast.error('Ein Fehler ist aufgetreten');
      setFormState({ ...formState, isSubmitting: false });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={formState.errors.name ? 'border-destructive' : ''}
        />
        {formState.errors.name && (
          <p className="text-sm text-destructive">{formState.errors.name[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Speichern
      </Button>
    </form>
  );
}
```

### Confirmation Dialog

```typescript
// src/components/shared/confirm-dialog.tsx
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  variant = 'default',
  onConfirm,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Usage
<ConfirmDialog
  open={showDeleteDialog}
  onOpenChange={setShowDeleteDialog}
  title="Training löschen?"
  description="Diese Aktion kann nicht rückgängig gemacht werden."
  confirmText="Löschen"
  variant="destructive"
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>
```

---

## Data Display Patterns

### Data Table

```typescript
// Simple table for lists
<div className="rounded-md border">
  <table className="w-full">
    <thead>
      <tr className="border-b bg-muted/50">
        <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
        <th className="h-12 px-4 text-right align-middle font-medium">Aktionen</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-b">
          <td className="p-4">{item.name}</td>
          <td className="p-4">
            <Badge variant={item.isActive ? 'default' : 'secondary'}>
              {item.isActive ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </td>
          <td className="p-4 text-right">
            <Button variant="ghost" size="sm">
              Bearbeiten
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### List with Actions

```typescript
<div className="space-y-4">
  {items.map((item) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      <div>
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Bearbeiten
        </Button>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ))}
</div>
```

---

## Toast Notifications

```typescript
import { toast } from 'sonner';

// Success
toast.success('Erfolgreich gespeichert');

// Error
toast.error('Ein Fehler ist aufgetreten');

// Info
toast.info('Hinweis: ...');

// With description
toast.success('Training erstellt', {
  description: 'Das Training wurde erfolgreich angelegt',
});

// With action
toast('Änderungen nicht gespeichert', {
  action: {
    label: 'Wiederherstellen',
    onClick: () => handleRestore(),
  },
});
```

---

## German Labels Reference

```typescript
// src/lib/constants/labels.ts
export const LABELS = {
  roles: {
    ATHLETE: 'Athlet',
    TRAINER: 'Trainer',
    ADMIN: 'Administrator',
  },
  attendance: {
    PRESENT: 'Anwesend',
    ABSENT_EXCUSED: 'Entschuldigt abwesend',
    ABSENT_UNEXCUSED: 'Unentschuldigt abwesend',
  },
  days: {
    MONDAY: 'Montag',
    TUESDAY: 'Dienstag',
    WEDNESDAY: 'Mittwoch',
    THURSDAY: 'Donnerstag',
    FRIDAY: 'Freitag',
    SATURDAY: 'Samstag',
    SUNDAY: 'Sonntag',
  },
  recurrence: {
    ONCE: 'Einmalig',
    WEEKLY: 'Wöchentlich',
    BIWEEKLY: 'Zweiwöchentlich',
    MONTHLY: 'Monatlich',
  },
  youth: {
    F: 'F-Jugend',
    E: 'E-Jugend',
    D: 'D-Jugend',
  },
  gender: {
    MALE: 'Männlich',
    FEMALE: 'Weiblich',
    OTHER: 'Divers',
  },
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    search: 'Suchen',
    filter: 'Filtern',
    loading: 'Wird geladen...',
    noResults: 'Keine Ergebnisse',
    error: 'Fehler',
    success: 'Erfolgreich',
  },
};
```

---

## Accessibility Guidelines

1. **Labels**: Always use `<Label htmlFor>` with inputs
2. **Focus**: Ensure focus states are visible
3. **Keyboard**: All interactions should work with keyboard
4. **ARIA**: Use Radix UI components which handle ARIA automatically
5. **Color contrast**: Maintain WCAG AA compliance
6. **Screen readers**: Test with VoiceOver/NVDA