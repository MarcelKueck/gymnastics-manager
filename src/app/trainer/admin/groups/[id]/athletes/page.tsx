'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Plus, 
  Search,
  UserMinus,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  youthCategory: string;
}

interface Group {
  id: string;
  name: string;
  recurringTraining: {
    id: string;
    name: string;
  };
}

export default function GroupAthletesPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [group, setGroup] = useState<Group | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [groupRes, athletesRes, allAthletesRes] = await Promise.all([
        fetch(`/api/admin/groups/${id}`),
        fetch(`/api/admin/groups/${id}/athletes`),
        fetch('/api/trainer/athletes?status=active'),
      ]);
      
      if (!groupRes.ok || !athletesRes.ok || !allAthletesRes.ok) {
        throw new Error('Failed to fetch');
      }
      
      const groupData = await groupRes.json();
      const athletesData = await athletesRes.json();
      const allAthletesData = await allAthletesRes.json();
      
      setGroup(groupData.data);
      setAthletes(athletesData.data);
      setAllAthletes(allAthletesData.data.map((a: { id: string; name: string; email: string; youthCategory: string }) => ({
        id: a.id,
        firstName: a.name.split(' ')[0],
        lastName: a.name.split(' ').slice(1).join(' '),
        email: a.email,
        youthCategory: a.youthCategory,
      })));
    } catch {
      setError('Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddAthletes = async () => {
    if (selectedAthletes.length === 0) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/groups/${id}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteIds: selectedAthletes }),
      });
      
      if (!res.ok) throw new Error('Failed to add');
      
      setIsAddDialogOpen(false);
      setSelectedAthletes([]);
      fetchData();
    } catch {
      setError('Fehler beim Hinzufügen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!confirm('Athlet wirklich aus der Gruppe entfernen?')) return;
    
    try {
      const res = await fetch(`/api/admin/groups/${id}/athletes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      });
      
      if (!res.ok) throw new Error('Failed to remove');
      fetchData();
    } catch {
      setError('Fehler beim Entfernen');
    }
  };

  // Filter athletes not already in group
  const availableAthletes = allAthletes.filter(
    (a) => !athletes.some((ga) => ga.id === a.id)
  );

  const filteredAvailableAthletes = availableAthletes.filter(
    (a) =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <Loading />;
  if (!group) return <div>Gruppe nicht gefunden</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/trainer/admin/trainings/${group.recurringTraining.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{group.name} - Athleten</h1>
          <p className="text-muted-foreground">{group.recurringTraining.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Athleten in dieser Gruppe ({athletes.length})
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Athleten hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Athleten hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Athleten suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredAvailableAthletes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Keine verfügbaren Athleten gefunden
                  </p>
                ) : (
                  filteredAvailableAthletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        checked={selectedAthletes.includes(athlete.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAthletes([...selectedAthletes, athlete.id]);
                          } else {
                            setSelectedAthletes(selectedAthletes.filter((id) => id !== athlete.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {athlete.firstName} {athlete.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {athlete.email}
                        </div>
                      </div>
                      <Badge variant="outline">{athlete.youthCategory}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleAddAthletes}
                disabled={isSubmitting || selectedAthletes.length === 0}
              >
                {isSubmitting ? 'Füge hinzu...' : `${selectedAthletes.length} hinzufügen`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {athletes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Athleten in dieser Gruppe</h3>
            <p className="text-muted-foreground text-center">
              Füge Athleten hinzu, um sie dieser Trainingsgruppe zuzuweisen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {athletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">
                      {athlete.firstName} {athlete.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {athlete.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{athlete.youthCategory}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAthlete(athlete.id)}
                    >
                      <UserMinus className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
