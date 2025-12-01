import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Trophy } from 'lucide-react';

export default function AthleteCompetitions() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wettkämpfe</h1>

      <Card>
        <CardHeader>
          <CardTitle>Kommende Wettkämpfe</CardTitle>
          <CardDescription>
            Wettkämpfe, für die du dich anmelden kannst
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Trophy className="h-10 w-10" />}
            title="Keine Wettkämpfe verfügbar"
            description="Aktuell sind keine Wettkämpfe zur Anmeldung freigegeben."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meine Anmeldungen</CardTitle>
          <CardDescription>
            Wettkämpfe, für die du angemeldet bist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Trophy className="h-10 w-10" />}
            title="Keine Anmeldungen"
            description="Du bist aktuell für keine Wettkämpfe angemeldet."
          />
        </CardContent>
      </Card>
    </div>
  );
}
