'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiken</h1>
        <p className="text-gray-600 mt-1">Detaillierte Auswertungen und Berichte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Statistiken folgen in einer zukünftigen Version
            </h3>
            <p className="text-gray-600">
              Hier werden detaillierte Auswertungen und Berichte zur Verfügung stehen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}