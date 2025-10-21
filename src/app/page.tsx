import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 opacity-20 blur-3xl" style={{ backgroundColor: '#509f28' }}></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 opacity-15 blur-3xl" style={{ backgroundColor: '#509f28' }}></div>
        </div>

        <div className="relative container mx-auto px-4 py-12 sm:py-16 md:py-20">
          {/* Club Name & Logo Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6 rounded-2xl shadow-lg overflow-hidden bg-white">
              <Image
                src="/sve_logo_Turnen.jpg"
                alt="SV Esting Turnen Logo"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              SV Esting Turnen
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Willkommen im Trainingsportal
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4 max-w-md mx-auto sm:max-w-none">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow">
                Anmelden
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-2 hover:bg-green-50" style={{ borderColor: '#509f28', color: '#509f28' }}>
                Registrieren
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto px-4">
            {/* Athlete Portal Card */}
            <div className="group bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border" style={{ borderColor: 'rgba(80, 159, 40, 0.2)' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(to bottom right, #509f28, #3d7a1f)' }}>
                <svg 
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">
                Athletenportal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Verwalte deine Trainingszeiten, melde dich ab und bleibe immer auf dem aktuellen Stand.
              </p>
            </div>

            {/* Trainer Portal Card */}
            <div className="group bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border" style={{ borderColor: 'rgba(80, 159, 40, 0.2)' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(to bottom right, #509f28, #3d7a1f)' }}>
                <svg 
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">
                Übungsleiterportal
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Organisiere Athleten, Gruppen und Trainingseinheiten zentral an einem Ort.
              </p>
            </div>

            {/* Statistics Card */}
            <div className="group bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border sm:col-span-2 lg:col-span-1" style={{ borderColor: 'rgba(80, 159, 40, 0.2)' }}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(to bottom right, #509f28, #3d7a1f)' }}>
                <svg 
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">
                Statistiken & Übersicht
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Behalte den Überblick über Anwesenheit, Fortschritte und Trainingspläne.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="relative py-8 sm:py-12 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            Trainingsmanagement für SV Esting
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            © {new Date().getFullYear()} SV Esting. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </main>
  );
}