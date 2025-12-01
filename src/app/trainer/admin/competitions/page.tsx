'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function AdminCompetitionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wettkämpfe</h1>
        <p className="text-muted-foreground">
          Wettkämpfe erstellen und Anmeldungen verwalten
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Wettkampfverwaltung</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Die Wettkampfverwaltung wird in einer späteren Phase implementiert.
            Hier können Sie dann Wettkämpfe erstellen, Anmeldungen verwalten und
            Ergebnisse eintragen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
