# Quick Reference Guide - Phase 7

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install resend react-email @react-email/components

# 2. Add to .env
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# 3. Restart server
npm run dev

# 4. Test emails
# Go to: http://localhost:3000/trainer/test-email
```

---

## 📧 Using Emails in Your Code

### Send Approval Email
```typescript
import { sendAthleteApprovalEmail } from '@/lib/email';

await sendAthleteApprovalEmail({
  athleteEmail: 'athlete@email.com',
  guardianEmail: 'parent@email.com', // optional
  athleteName: 'Max Mustermann',
  trainingDays: ['monday', 'thursday'],
  trainingHours: ['first', 'second'],
  group: 2,
  youthCategory: 'U12',
  isCompetition: true,
});
```

### Send Schedule Change Email
```typescript
import { sendScheduleChangeEmail } from '@/lib/email';

await sendScheduleChangeEmail({
  athleteEmail: 'athlete@email.com',
  guardianEmail: 'parent@email.com',
  athleteName: 'Max Mustermann',
  oldSchedule: {
    trainingDays: ['monday'],
    trainingHours: ['first'],
    group: 1,
  },
  newSchedule: {
    trainingDays: ['monday', 'thursday'],
    trainingHours: ['first', 'second'],
    group: 2,
  },
});
```

### Send Training Plan Email
```typescript
import { sendTrainingPlanUploadedEmail } from '@/lib/email';

await sendTrainingPlanUploadedEmail({
  athleteEmails: [
    { email: 'athlete1@email.com', name: 'Athlet 1' },
    { email: 'athlete2@email.com', name: 'Athlet 2' },
  ],
  category: 'strength_goals',
  title: 'Kraftziele Herbst 2024',
  targetDate: '2024-12-31',
});
```

### Check for Absence Alerts
```typescript
import { checkAndSendAbsenceAlert } from '@/lib/absenceAlert';

// After marking attendance as unexcused
await checkAndSendAbsenceAlert(athleteId);
```

---

## 🎨 Using Toast Notifications

### In a Client Component
```typescript
'use client';
import { useToast } from '@/components/ui/toast';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Erfolgreich gespeichert!', 'success');
  };

  const handleError = () => {
    showToast('Fehler beim Speichern', 'error');
  };

  const handleWarning = () => {
    showToast('Warnung: Bitte überprüfen', 'warning');
  };

  return <button onClick={handleSuccess}>Speichern</button>;
}
```

---

## 🔄 Using Loading States

### Page Loader
```typescript
import { PageLoader } from '@/components/ui/loading';

if (loading) {
  return <PageLoader />;
}
```

### Skeleton Loaders
```typescript
import { SkeletonStats, SkeletonCard, SkeletonTable } from '@/components/ui/loading';

// For dashboard stats
<SkeletonStats count={4} />

// For cards
<SkeletonCard count={3} />

// For tables
<SkeletonTable rows={10} cols={5} />
```

### Button Loading State
```typescript
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Wird gespeichert...
    </>
  ) : (
    'Speichern'
  )}
</Button>
```

---

## 🛡️ Error Handling

### Use Error Display
```typescript
import { ErrorDisplay } from '@/components/ErrorBoundary';

if (error) {
  return <ErrorDisplay error={error} retry={fetchData} />;
}
```

### Try-Catch with Toast
```typescript
const { showToast } = useToast();

try {
  await someApiCall();
  showToast('Erfolgreich!', 'success');
} catch (error) {
  showToast('Fehler aufgetreten', 'error');
  console.error(error);
}
```

---

## 📱 Mobile Responsive Patterns

### Responsive Grid
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content */}
</div>
```

### Responsive Text
```typescript
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Heading
</h1>
<p className="text-sm sm:text-base">
  Body text
</p>
```

### Mobile Menu Pattern
```typescript
const [menuOpen, setMenuOpen] = useState(false);

// Mobile header
<div className="lg:hidden">
  <button onClick={() => setMenuOpen(!menuOpen)}>
    {menuOpen ? <X /> : <Menu />}
  </button>
</div>

// Desktop sidebar
<div className="hidden lg:block">
  {/* Navigation */}
</div>
```

### Touch-Friendly Buttons
```typescript
// Minimum 44px touch target
<button className="min-h-[44px] min-w-[44px] p-3">
  Click me
</button>
```

---

## 🎯 Common Tasks

### Add New Email Type
1. Add function to `src/lib/email.ts`
2. Use `emailTemplate()` wrapper
3. Add test case in `/trainer/test-email`

### Add Loading to Page
1. Import `PageLoader` or skeleton
2. Add `loading` state
3. Show loader while fetching
4. Handle errors appropriately

### Add Toast Notification
1. Import `useToast`
2. Call `showToast(message, type)`
3. Types: 'success', 'error', 'warning', 'info'

### Make Component Mobile-Friendly
1. Use responsive Tailwind classes
2. Test at 375px width
3. Ensure touch targets 44px+
4. Use `text-base` on inputs (prevents iOS zoom)

---

## 🐛 Debug Checklist

### Email Not Sending
```bash
# 1. Check env vars
echo $RESEND_API_KEY

# 2. Check server logs
# Look for "✅ Email sent" or "❌ Failed"

# 3. Test with test endpoint
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type":"approval","testEmail":"your@email.com"}'

# 4. Check Resend dashboard
# Go to resend.com > Logs
```

### Mobile Issues
```javascript
// 1. Test in Chrome DevTools
// Press F12 > Toggle device toolbar (Ctrl+Shift+M)

// 2. Check console for errors
// Look for React errors or warnings

// 3. Test on real device
// Use ngrok or local network IP

// 4. Check touch targets
// All interactive elements should be 44px+
```

### Loading State Issues
```typescript
// Pattern for proper loading states
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true); // Start loading
  try {
    const data = await fetch('/api/endpoint');
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false); // Always stop loading
  }
};
```

---

## 📊 Performance Tips

### Optimize Images
```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // For above-the-fold images
/>
```

### Debounce Search
```typescript
import { useState, useEffect } from 'react';

const [search, setSearch] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 300);
  return () => clearTimeout(timer);
}, [search]);

// Use debouncedSearch for API calls
```

### Lazy Load Components
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <PageLoader /> }
);
```

---

## 🔐 Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Phase 7 - Email
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Production
# Update these for production deployment
NEXTAUTH_URL="https://yourdomain.com"
EMAIL_FROM="noreply@youractualdomain.com"
```

---

## 🎨 Brand Colors

```typescript
// Primary brand color (club green)
const PRIMARY = '#509f28';
const PRIMARY_DARK = '#3d7a1f';

// Status colors
const SUCCESS = '#10b981';
const ERROR = '#ef4444';
const WARNING = '#f59e0b';

// Usage in Tailwind
className="bg-[#509f28] text-white"
className="hover:bg-[#3d7a1f]"
```

---

## ✅ Testing Checklist

Before committing:
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Emails send successfully
- [ ] Mobile menu works
- [ ] Loading states show
- [ ] Errors handled gracefully
- [ ] Toast notifications work
- [ ] Tested on mobile viewport
- [ ] Accessibility (keyboard nav)

---

## 📞 Support Resources

- **Resend Docs**: https://resend.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Email**: https://react.email/docs

---

## 🎉 You're Done!

Phase 7 is complete. Your app now has:
- ✅ Professional email system
- ✅ Full mobile support
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Polished UI/UX

Happy coding! 🚀