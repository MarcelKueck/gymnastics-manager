'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  UserCheck, 
  UserX, 
  Clock, 
  Users,
  Check,
  X,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Athlete {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  groups: string[];
  youthCategory?: string;
  joinedAt: string;
  attendanceRate?: number;
}

export default function TrainerAthletesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('status') === 'pending' ? 'pending' : 'active';
  
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAthletes = () => {
    setIsLoading(true);
    fetch('/api/trainer/athletes')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setAthletes(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  const handleApprove = async (athleteId: string) => {
    setProcessingId(athleteId);
    try {
      const res = await fetch(`/api/trainer/athletes/${athleteId}/approve`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to approve');
      fetchAthletes();
      // Notify navigation to update pending count
      window.dispatchEvent(new CustomEvent('pending-athletes-updated'));
    } catch {
      setError('Fehler beim Freigeben');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (athleteId: string) => {
    setProcessingId(athleteId);
    try {
      const res = await fetch(`/api/trainer/athletes/${athleteId}/reject`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to reject');
      fetchAthletes();
      // Notify navigation to update pending count
      window.dispatchEvent(new CustomEvent('pending-athletes-updated'));
    } catch {
      setError('Fehler beim Ablehnen');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'pending') {
      return matchesSearch && athlete.status === 'PENDING';
    } else if (activeTab === 'active') {
      return matchesSearch && athlete.status === 'ACTIVE';
    } else {
      return matchesSearch && athlete.status === 'INACTIVE';
    }
  });

  const pendingCount = athletes.filter((a) => a.status === 'PENDING').length;
  const activeCount = athletes.filter((a) => a.status === 'ACTIVE').length;
  const inactiveCount = athletes.filter((a) => a.status === 'INACTIVE').length;

  if (error) return <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Fehler beim Laden: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Athleten</h1>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Athleten suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Aktiv
            <Badge variant="secondary">{activeCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ausstehend
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Inaktiv
            <Badge variant="secondary">{inactiveCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <Loading />
          ) : filteredAthletes.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Keine aktiven Athleten"
              description={searchQuery ? 'Keine Athleten gefunden' : 'Es gibt noch keine aktiven Athleten'}
            />
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {isLoading ? (
            <Loading />
          ) : filteredAthletes.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-12 w-12" />}
              title="Keine ausstehenden Anmeldungen"
              description="Alle Anmeldungen wurden bearbeitet"
            />
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete) => (
                <PendingAthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  onApprove={() => handleApprove(athlete.id)}
                  onReject={() => handleReject(athlete.id)}
                  isProcessing={processingId === athlete.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive">
          {isLoading ? (
            <Loading />
          ) : filteredAthletes.length === 0 ? (
            <EmptyState
              icon={<UserX className="h-12 w-12" />}
              title="Keine inaktiven Athleten"
              description="Es gibt keine inaktiven Athleten"
            />
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AthleteCard({ athlete }: { athlete: Athlete }) {
  return (
    <Link href={`/trainer/athletes/${athlete.id}`}>
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-lg font-medium">
                  {athlete.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{athlete.name}</p>
                  {athlete.youthCategory && (
                    <Badge variant="outline">{athlete.youthCategory}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{athlete.email}</p>
                <div className="flex gap-1 mt-1">
                  {athlete.groups.map((group) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {athlete.attendanceRate !== undefined && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Anwesenheit</p>
                  <p className={`font-medium ${
                    athlete.attendanceRate >= 80 ? 'text-emerald-600' :
                    athlete.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {athlete.attendanceRate}%
                  </p>
                </div>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PendingAthleteCard({
  athlete,
  onApprove,
  onReject,
  isProcessing,
}: {
  athlete: Athlete;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  return (
    <Card className="border-amber-500">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">{athlete.name}</p>
              <p className="text-sm text-muted-foreground">{athlete.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Registriert am {new Date(athlete.joinedAt).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onReject}
              disabled={isProcessing}
              className="h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Ablehnen
            </Button>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isProcessing}
              className="h-10 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Freigeben
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="flex justify-center text-muted-foreground mb-4">
          {icon}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
