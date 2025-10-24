import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, BarChart3, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            SV Esting Turnen
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Trainingsmanagement-System für Athleten und Trainer
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Registrieren
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Funktionen</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Athletenverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Verwalte Athletenprofile, Genehmigungen und Trainingszuweisungen
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Trainingsplanung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Erstelle und verwalte wiederkehrende Trainingseinheiten und Gruppen
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Anwesenheit</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Erfasse Anwesenheit und verfolge die Teilnahme über Zeit
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Dateiverwaltung</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Teile Trainingspläne und Dokumente mit Athleten
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 SV Esting Turnen. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}