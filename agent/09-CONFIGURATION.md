# Configuration & Deployment

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gymnastics_manager"

# NextAuth
NEXTAUTH_SECRET="your-random-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# File Upload
UPLOAD_DIR="./uploads"

# Admin
ADMIN_EMAIL="admin@svesting.de"
```

### Optional Variables

```env
# Development
NODE_ENV="development"

# Feature Flags
ENABLE_ABSENCE_ALERTS="true"

# Default Settings (overridden by database settings)
ABSENCE_ALERT_THRESHOLD="3"
CANCELLATION_DEADLINE_HOURS="2"
MAX_UPLOAD_SIZE_MB="10"
SESSION_GENERATION_DAYS="90"
```

### Production Variables

For production deployment (e.g., Vercel), configure:

```env
# Database (use managed PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# NextAuth (production URL)
NEXTAUTH_SECRET="production-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Email
RESEND_API_KEY="re_xxxxxxxxxxxx"

# File Upload (use cloud storage for production)
UPLOAD_DIR="/tmp/uploads"  # or cloud storage path
```

---

## Database Setup

### Local Development

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql

   # Ubuntu
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**:
   ```bash
   createdb gymnastics_manager
   ```

3. **Configure Connection**:
   ```env
   DATABASE_URL="postgresql://localhost:5432/gymnastics_manager"
   ```

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema to database (development - no migrations)
npx prisma db push

# Create migration (production-ready)
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Reset database (deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

### Database Migrations

For production, always use migrations:

```bash
# Create initial migration
npx prisma migrate dev --name init

# Create subsequent migrations
npx prisma migrate dev --name add_feature_x

# Deploy migrations in production
npx prisma migrate deploy
```

---

## Email Configuration (Resend)

### Setup

1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Generate API key
4. Add to environment variables

### Email Service Implementation

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'noreply@svesting.de'; // Use your verified domain

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Email service unavailable' };
  }
}

// Email templates
export const emailTemplates = {
  registrationNotification: (athlete: { firstName: string; lastName: string; email: string }) => ({
    subject: 'Neue Registrierung - SV Esting',
    html: `
      <h2>Neue Athleten-Registrierung</h2>
      <p><strong>Name:</strong> ${athlete.firstName} ${athlete.lastName}</p>
      <p><strong>E-Mail:</strong> ${athlete.email}</p>
      <p>Bitte melden Sie sich an, um die Registrierung zu prüfen und zu genehmigen.</p>
    `,
  }),

  approvalNotification: (firstName: string) => ({
    subject: 'Registrierung genehmigt - SV Esting',
    html: `
      <h2>Willkommen bei SV Esting!</h2>
      <p>Hallo ${firstName},</p>
      <p>Deine Registrierung wurde genehmigt. Du kannst dich jetzt anmelden und deinen Trainingsplan einsehen.</p>
      <p>Viele Grüße,<br>SV Esting Turnen</p>
    `,
  }),

  absenceAlert: (firstName: string, absenceCount: number, periodDays: number) => ({
    subject: 'Abwesenheitshinweis - SV Esting',
    html: `
      <h2>Abwesenheitshinweis</h2>
      <p>Hallo ${firstName},</p>
      <p>Du hast in den letzten ${periodDays} Tagen ${absenceCount} unentschuldigte Abwesenheiten.</p>
      <p>Bitte melde dich bei Fragen bei deinem Trainer.</p>
      <p>Viele Grüße,<br>SV Esting Turnen</p>
    `,
  }),

  sessionCancellation: (firstName: string, date: string, reason: string) => ({
    subject: 'Training abgesagt - SV Esting',
    html: `
      <h2>Training abgesagt</h2>
      <p>Hallo ${firstName},</p>
      <p>Das Training am ${date} wurde abgesagt.</p>
      <p><strong>Grund:</strong> ${reason}</p>
      <p>Viele Grüße,<br>SV Esting Turnen</p>
    `,
  }),
};
```

### Testing Emails

For development, you can:
1. Use Resend's test mode
2. Log emails to console instead of sending
3. Use a test email address

```typescript
// Development email override
export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    return { success: true };
  }
  
  // Production: actually send
  // ...
}
```

---

## File Upload Configuration

### Local Storage

```typescript
// src/lib/upload.ts
import { mkdir, writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function saveFile(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  
  const fileName = `${uuid()}.pdf`;
  const filePath = join(UPLOAD_DIR, fileName);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  
  return fileName;
}

export async function deleteFile(fileName: string): Promise<void> {
  const filePath = join(UPLOAD_DIR, fileName);
  await unlink(filePath);
}

export async function getFile(fileName: string): Promise<Buffer> {
  const filePath = join(UPLOAD_DIR, fileName);
  return readFile(filePath);
}
```

### Production Considerations

For production, consider using cloud storage:

```typescript
// Example: AWS S3 configuration
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

export async function saveFileToS3(file: File): Promise<string> {
  const fileName = `${uuid()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: 'application/pdf',
  }));
  
  return fileName;
}
```

---

## NextAuth Configuration

### Session Configuration

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ...providers

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
};
```

### Generate Secret

```bash
# Generate a secure secret
openssl rand -base64 32
```

---

## Development Setup

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd gymnastics-manager

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Setup database
npx prisma generate
npx prisma db push

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

### Development Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "prisma db seed",
    "prisma:reset": "prisma migrate reset",
    "type-check": "tsc --noEmit"
  },
  "prisma": {
    "seed": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## Deployment

### Vercel Deployment

1. **Connect Repository**:
   - Import project in Vercel dashboard
   - Connect GitHub repository

2. **Configure Environment Variables**:
   - Add all required environment variables in Vercel dashboard
   - Use production database URL

3. **Configure Build**:
   ```json
   // vercel.json (optional)
   {
     "buildCommand": "prisma generate && next build",
     "installCommand": "npm install"
   }
   ```

4. **Database Migrations**:
   ```bash
   # Before deployment, run migrations
   npx prisma migrate deploy
   ```

### Database Hosting Options

| Provider    | Free Tier | Notes                           |
| ----------- | --------- | ------------------------------- |
| Supabase    | 500MB     | PostgreSQL, easy setup          |
| Railway     | $5 credit | PostgreSQL, auto-scaling        |
| Neon        | 3GB       | Serverless PostgreSQL           |
| PlanetScale | 5GB       | MySQL (requires schema changes) |

### Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Email service configured and verified
- [ ] File storage configured (cloud for production)
- [ ] Admin user created
- [ ] System settings initialized
- [ ] SSL/HTTPS enabled
- [ ] Domain configured

---

## Monitoring & Logging

### Error Logging

```typescript
// src/lib/logger.ts
export function logError(context: string, error: unknown) {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // e.g., Sentry, LogRocket, etc.
  }
}
```

### API Logging

```typescript
// Middleware for API logging
export function withLogging(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const start = Date.now();
    const response = await handler(request, context);
    const duration = Date.now() - start;
    
    console.log(
      `[${request.method}] ${request.url} - ${response.status} (${duration}ms)`
    );
    
    return response;
  };
}
```

---

## Security Considerations

### Password Hashing

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Input Validation

Always validate on server-side:

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// In API route
const validation = schema.safeParse(body);
if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: validation.error.flatten() },
    { status: 400 }
  );
}
```

### Rate Limiting (Future Enhancement)

```typescript
// Example using upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

// In API route
const { success } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

## Backup Strategy

### Database Backup

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20240115.sql
```

### Automated Backups

Most managed database providers offer automated backups. Configure:
- Daily backups
- 7-day retention minimum
- Point-in-time recovery if available

---

## Troubleshooting

### Common Issues

**Prisma Client Not Generated**
```bash
npx prisma generate
```

**Database Connection Failed**
- Check DATABASE_URL format
- Ensure database server is running
- Verify credentials

**Session Not Persisting**
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches actual URL
- Clear browser cookies

**Emails Not Sending**
- Verify RESEND_API_KEY
- Check domain verification in Resend
- Review Resend dashboard for errors

**File Upload Failing**
- Check UPLOAD_DIR permissions
- Verify disk space
- Check file size limits

### Debug Mode

Enable NextAuth debug logging:

```typescript
export const authOptions: NextAuthOptions = {
  // ...
  debug: true, // Enable in development
};
```

Enable Prisma query logging:

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```