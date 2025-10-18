// Save as: src/app/login/page.tsx

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"athlete" | "trainer">("athlete");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        userType,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Redirect based on user type
        const callbackUrl = searchParams.get("callbackUrl");
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          router.push(userType === "athlete" ? "/athlete/dashboard" : "/trainer/dashboard");
        }
      }
    } catch {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Anmelden
        </h1>

        {/* User Type Selector */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType("athlete")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              userType === "athlete"
                ? "bg-[rgb(40,167,69)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Athlet
          </button>
          <button
            type="button"
            onClick={() => setUserType("trainer")}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              userType === "trainer"
                ? "bg-[rgb(40,167,69)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Übungsleiter
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(40,167,69)] text-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(40,167,69)] text-gray-900"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </Button>
        </form>

        {userType === "athlete" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Noch kein Konto?{" "}
              <Link
                href="/register"
                className="text-[rgb(40,167,69)] hover:text-[rgb(33,140,58)] font-medium"
              >
                Jetzt registrieren
              </Link>
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-700"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}