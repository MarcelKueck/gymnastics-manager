// Save as: src/app/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Gymnastics Training Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Moderne Trainingsverwaltung für Turnvereine
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/login">
              <Button size="lg">Anmelden</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" size="lg">
                Registrieren
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Athletenportal</h3>
              <p className="text-gray-600">
                Verwalte deine Trainingszeiten, sage Termine ab und lade Trainingspläne herunter.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🏋️</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Übungsleiterportal</h3>
              <p className="text-gray-600">
                Verwalte Athleten, Gruppen und Anwesenheit. Organisiere Trainingspläne zentral.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Statistiken</h3>
              <p className="text-gray-600">
                Verfolge Anwesenheit und Fortschritte mit detaillierten Analysen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}