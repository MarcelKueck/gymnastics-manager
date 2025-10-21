# Profile Pages - Developer Quick Reference

## API Endpoints

### Athlete Profile
```typescript
GET  /api/athlete/profile     // Get athlete profile with statistics
PUT  /api/athlete/profile     // Update contact information
PUT  /api/athlete/password    // Change password
```

### Trainer Profile
```typescript
GET  /api/trainer/profile     // Get trainer profile with statistics
PUT  /api/trainer/profile     // Update contact information
PUT  /api/trainer/password    // Change password
```

### Admin Profile
```typescript
GET  /api/admin/profile       // Get admin profile with system stats
PUT  /api/admin/profile       // Update contact information
PUT  /api/admin/password      // Change password
```

---

## Response Formats

### Athlete Profile Response
```typescript
{
  athlete: {
    // Basic info
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: string;
    phone: string;
    
    // Optional contacts
    guardianName: string | null;
    guardianEmail: string | null;
    guardianPhone: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    
    // Training config
    youthCategory: string;
    competitionParticipation: boolean;
    autoConfirmFutureSessions: boolean;
    
    // Status
    isApproved: boolean;
    approvedAt: string | null;
    createdAt: string;
    
    // Group assignments
    groupAssignments: Array<{
      trainingDay: string;
      hourNumber: number;
      groupNumber: number;
    }>;
    
    // Statistics (NEW)
    _count: {
      cancellations: number;        // This year
      attendanceRecords: number;    // This year
    };
    nextSession: {                  // Upcoming session
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      dayOfWeek: string;
      groupNumber: number;
    } | null;
    uploadsCount: number;            // Available documents
    attendanceRate: number;          // Percentage
    totalSessions: number;           // For rate calculation
  }
}
```

### Trainer Profile Response
```typescript
{
  trainer: {
    // Basic info
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    
    // Status
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    
    // Statistics
    _count: {
      approvedAthletes: number;              // Total approved
      sessionAssignments: number;            // All time
      uploads: number;                       // Total uploads
      recurringTrainingAssignments: number;  // Active assignments
      attendanceMarked: number;              // This year
    };
    
    // Calculated stats (NEW)
    sessionsConducted: number;               // This year
    athletesInGroups: number;                // Currently assigned
  }
}
```

### Admin Profile Response
```typescript
{
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  },
  statistics: {
    totalAthletes: number;
    totalTrainers: number;
    totalRecurringTrainings: number;
    pendingApprovals: number;
    totalUploads: number;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
  },
  recentAuditLogs: Array<{
    id: string;
    entityType: string;
    action: string;
    performedAt: string;
    performedByUser: {
      firstName: string;
      lastName: string;
    };
  }>
}
```

---

## Using StatCard Component

### Import
```typescript
import { StatCard } from '@/components/ui/stat-card';
import { Calendar } from 'lucide-react';
```

### Basic Usage
```typescript
<StatCard
  title="Training Sessions"
  value={42}
  icon={Calendar}
  color="green"
/>
```

### With Subtitle
```typescript
<StatCard
  title="Attendance Rate"
  value="93%"
  icon={TrendingUp}
  color="blue"
  subtitle="of 45 sessions"
/>
```

### Available Colors
- `blue` - User/People stats
- `green` - Sessions/Training stats
- `purple` - Documents/Files stats
- `orange` - Pending actions
- `teal` - Groups/Assignments
- `red` - Absences/Issues

### Grid Layout Example
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard {...props1} />
  <StatCard {...props2} />
  <StatCard {...props3} />
  <StatCard {...props4} />
</div>
```

---

## Common Patterns

### Loading State
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Lade Profil...</p>
      </div>
    </div>
  );
}
```

### Error Handling
```typescript
if (error && !profile) {
  return <Alert variant="error">{error}</Alert>;
}

if (!profile) {
  return <Alert variant="error">Profil nicht gefunden</Alert>;
}
```

### Editable Fields Pattern
```typescript
// State
const [isEditing, setIsEditing] = useState(false);
const [editForm, setEditForm] = useState({ email: '', phone: '' });

// Display
{isEditing ? (
  <Input
    value={editForm.email}
    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
  />
) : (
  <p className="font-medium">{profile.email}</p>
)}
```

### Password Change Pattern
```typescript
const [showPasswordForm, setShowPasswordForm] = useState(false);
const [passwordForm, setPasswordForm] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Validation
if (passwordForm.newPassword.length < 8) {
  setPasswordError('Password must be at least 8 characters');
  return;
}

if (passwordForm.newPassword !== passwordForm.confirmPassword) {
  setPasswordError('Passwords do not match');
  return;
}
```

---

## Database Queries

### Current Year Range
```typescript
const currentYear = new Date().getFullYear();
const yearStart = new Date(currentYear, 0, 1);
const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

// Use in where clause
where: {
  markedAt: { gte: yearStart, lte: yearEnd }
}
```

### Distinct Count
```typescript
// Get unique athletes
const athletesData = await prisma.recurringTrainingAthleteAssignment.findMany({
  where: { /* conditions */ },
  select: { athleteId: true },
  distinct: ['athleteId'],
});
const count = athletesData.length;
```

### Next Session Query
```typescript
const nextSession = await prisma.trainingSession.findFirst({
  where: {
    date: { gte: new Date() },
    isCancelled: false,
    recurringTraining: {
      athleteAssignments: {
        some: { athleteId: userId },
      },
    },
  },
  orderBy: { date: 'asc' },
  select: { /* fields */ },
});
```

---

## Translations

### German Translations Used

#### Gender
```typescript
const genderTranslations: Record<string, string> = {
  MALE: 'Männlich',
  FEMALE: 'Weiblich',
  OTHER: 'Divers',
};
```

#### Days
```typescript
const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};
```

#### Roles
```typescript
const roleTranslations: Record<string, string> = {
  TRAINER: 'Trainer',
  ADMIN: 'Administrator',
  ATHLETE: 'Athlet',
};
```

#### Actions (Audit Log)
```typescript
const actionTranslations: Record<string, string> = {
  create: 'Erstellt',
  update: 'Aktualisiert',
  delete: 'Gelöscht',
};
```

#### Entity Types (Audit Log)
```typescript
const entityTypeTranslations: Record<string, string> = {
  attendance: 'Anwesenheit',
  athlete: 'Athlet',
  session: 'Training',
  trainer: 'Trainer',
  upload: 'Upload',
};
```

---

## Date Formatting

### Using date-fns
```typescript
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// Short date
format(new Date(dateString), 'dd.MM.yyyy', { locale: de })
// Output: "21.10.2024"

// Long date
format(new Date(dateString), 'EEEE, dd. MMMM yyyy', { locale: de })
// Output: "Montag, 21. Oktober 2024"

// Date with time
format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de })
// Output: "21.10.2024 14:30"
```

---

## Testing Checklist

### For Each Profile Page:
- [ ] Page loads without errors
- [ ] Loading state displays correctly
- [ ] Profile data loads and displays
- [ ] Statistics show correct values
- [ ] Edit mode works (contact info)
- [ ] Save functionality works
- [ ] Cancel edit resets form
- [ ] Password change works
- [ ] Password validation works
- [ ] Error messages display
- [ ] Success messages display
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] All translations correct
- [ ] Date formatting correct
- [ ] Icons display correctly
- [ ] Colors match design

---

## Common Issues & Solutions

### Issue: Statistics show 0
**Solution:** Ensure database has seed data for the current year

### Issue: Next session not showing
**Solution:** Check that there are future training sessions in the database

### Issue: Attendance rate shows 0%
**Solution:** Verify attendance records exist with PRESENT status

### Issue: Type errors on _count
**Solution:** Update TypeScript interface to include new fields

### Issue: Date formatting errors
**Solution:** Ensure date-fns and locale are imported correctly

---

## Performance Tips

1. **Use server-side calculations** for statistics
2. **Aggregate at database level** when possible
3. **Cache profile data** on client (React state)
4. **Limit audit log** to last 10 entries
5. **Use proper indexes** on date fields
6. **Avoid N+1 queries** with proper includes

---

## Future Enhancements

Potential improvements:
- Add profile picture upload
- Export statistics as PDF
- Chart visualizations for trends
- Comparison with previous year
- Email notification settings
- Two-factor authentication
- Activity timeline
- Achievement badges

---

**Need Help?** Check the full documentation in `PROFILE_PAGES_UPDATE.md`
