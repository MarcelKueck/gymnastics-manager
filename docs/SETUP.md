# Phase 1 Setup Instructions

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud service like Neon, Supabase, or Vercel Postgres)

## Step-by-Step Setup

### 1. Install Missing Dependencies

```bash
npm install clsx tailwind-merge
```

### 2. Database Setup

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL on your system
# Create a database named 'gymnastics_db'
# Update DATABASE_URL in .env with your local credentials
```

**Option B: Cloud Database (Recommended for beginners)**
- Go to [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com)
- Create a free account
- Create a new project
- Copy the connection string
- Update `DATABASE_URL` in your `.env` file

### 3. Update Environment Variables

Edit your `.env` file with your actual database connection string:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### 4. Generate Prisma Client and Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Open Prisma Studio to view your database (optional)
npx prisma studio
```

### 5. Update tailwind.config.ts

Replace the content with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 6. Create Global CSS

Update `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50;
  }
}
```

### 7. Create Required Directories

```bash
mkdir -p src/app/api/auth/[...nextauth]
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/app/athlete
mkdir -p src/app/trainer
mkdir -p src/app/register
mkdir -p src/app/login
```

### 8. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## Testing the Setup

1. **Visit Homepage**: Go to `http://localhost:3000`
2. **Register an Athlete**: Click "Registrieren" and fill out the form
3. **Check Database**: Run `npx prisma studio` to see the new athlete record
   - Note: `isApproved` should be `false`
   - No training configuration exists yet (coach will add this)

## What's Working Now

✅ **Foundation Complete:**
- Next.js 14 with App Router
- PostgreSQL database with Prisma ORM
- NextAuth.js authentication system
- Athlete registration (contact info only)
- Login system (for both athletes and trainers)
- Protected routes with middleware
- Basic UI components

✅ **Database Schema:**
- Athletes table (with pending approval state)
- Trainers table
- Training sessions
- Group assignments
- Cancellations
- Attendance records
- Training plans
- Audit logs

## What's NOT Working Yet

❌ Athlete portal pages (dashboard, schedule, profile)
❌ Trainer portal pages (approval, athlete management, sessions)
❌ Training session management
❌ Attendance tracking
❌ File upload for training plans
❌ Email notifications

## Next Steps - Phase 2

We'll build the **Athlete Portal** next:
1. Dashboard page
2. Training schedule view (coach-assigned, read-only)
3. Cancellation system with mandatory reason
4. Auto-confirm toggle
5. Profile page with editable contact info
6. Attendance history view

## Troubleshooting

**Database Connection Issues:**
```bash
# Test your database connection
npx prisma db pull
```

**Migration Errors:**
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

**Port Already in Use:**
```bash
# Kill process on port 3000
# Mac/Linux: lsof -ti:3000 | xargs kill
# Windows: netstat -ano | findstr :3000
```

## Creating Test Trainer Account

Since there's no trainer registration UI, you'll need to create a trainer manually:

```bash
# Open Prisma Studio
npx prisma studio

# Or use this seed script (create src/prisma/seed.ts):
```

Let me know when Phase 1 is complete and running, then we'll move to Phase 2!