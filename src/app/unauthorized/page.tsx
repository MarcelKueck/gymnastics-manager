// Save as: src/app/unauthorized/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Zugriff verweigert
        </h1>
        <p className="text-gray-600 mb-6">
          Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="secondary">Zur Startseite</Button>
          </Link>
          <Link href="/login">
            <Button>Anmelden</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}