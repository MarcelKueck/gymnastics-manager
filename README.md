# SV Esting Training Management System

Ein vollständiges Trainingsmanagement-System für SV Esting Turnen, entwickelt mit Next.js 14, TypeScript, Prisma und PostgreSQL.

## Features

### Athleten
- Selbstregistrierung mit Genehmigungsprozess
- Persönliches Dashboard mit Trainingsübersicht
- Trainingsplan-Anzeige
- Absagen von Trainingseinheiten
- Anwesenheitshistorie und Statistiken
- Zugriff auf Trainingspläne und Dokumente

### Trainer
- Dashboard mit Übersicht über kommende Trainings
- Athletenverwaltung und -genehmigung
- Trainingsplanung und -durchführung
- Anwesenheitserfassung
- Übungsverwaltung
- Statistiken und Reports

### Administratoren
- Verwaltung wiederkehrender Trainings
- Gruppenverwaltung
- Trainerzuweisung
- Athletenzuweisung zu Gruppen
- Dateikategorien verwalten
- Trainer-Stundenverwaltung
- Automatische Session-Generierung

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Email**: Resend
- **File Upload**: Native File System

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/svesting-training.git
cd svesting-training
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database and API credentials.

4. Set up the database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed the database
npm run prisma:seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main entities:
- **Athlete**: User profiles for athletes
- **Trainer**: User profiles for trainers/admins
- **RecurringTraining**: Weekly training schedule
- **TrainingGroup**: Groups within each training
- **TrainingSession**: Individual training instances
- **AttendanceRecord**: Attendance tracking
- **Upload**: File management
- **AuditLog**: System audit trail

## Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── athlete/           # Athlete pages
│   ├── trainer/           # Trainer pages
│   └── login/             # Auth pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── athlete/          # Athlete-specific components
│   ├── trainer/          # Trainer-specific components
│   ├── admin/            # Admin-specific components
│   └── shared/           # Shared components
├── lib/                   # Utility functions
│   ├── api/              # API helpers
│   ├── repositories/     # Data access layer
│   ├── services/         # Business logic
│   ├── validation/       # Zod schemas
│   └── constants/        # Constants and enums
└── prisma/               # Prisma schema and migrations
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `RESEND_API_KEY`: API key for email service
- `UPLOAD_DIR`: Directory for file uploads

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker
```bash
docker build -t svesting-training .
docker run -p 3000:3000 svesting-training
```

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Security

- Passwords are hashed with bcrypt
- Role-based access control (RBAC)
- Session-based authentication with NextAuth.js
- Input validation with Zod
- SQL injection prevention with Prisma
- CSRF protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Proprietary - SV Esting Turnen

## Support

For support, email support@svesting-turnen.de