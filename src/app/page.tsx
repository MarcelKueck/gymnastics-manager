import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-semibold">
            SV Esting Turnen
          </CardTitle>
          <CardDescription>
            Trainingsmanagement für Athleten und Trainer
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link href="/login" className="w-full">
            <Button className="w-full" size="lg">
              Anmelden
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              Registrieren
            </Button>
          </Link>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SV Esting e.V. - Abteilung Turnen
      </p>
    </div>
  );
}
