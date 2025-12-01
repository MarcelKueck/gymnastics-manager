'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function AdminHoursPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trainerstunden</h1>
        <p className="text-muted-foreground">
          Trainerstunden erfassen und auswerten
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Stundenverwaltung</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Die Stundenverwaltung wird in einer späteren Phase implementiert.
            Hier können Sie dann Trainerstunden erfassen und Berichte erstellen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
