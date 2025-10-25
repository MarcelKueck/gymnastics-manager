'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  Check,
  X,
  Trophy,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

export function AthleteCompetitionsContent() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any | null>(null);
  const [registrationNotes, setRegistrationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/athlete/competitions');
      if (!response.ok) throw new Error('Fehler beim Laden der Wettkämpfe');

      const data = await response.json();
      setCompetitions(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedCompetition) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/athlete/competitions/${selectedCompetition.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: registrationNotes || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler bei der Anmeldung');
      }

      toast.success('Erfolgreich angemeldet!');
      setShowRegisterDialog(false);
      setSelectedCompetition(null);
      setRegistrationNotes('');
      fetchCompetitions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler bei der Anmeldung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnregister = async (competitionId: string) => {
    if (!confirm('Möchtest du dich wirklich von diesem Wettkampf abmelden?')) return;

    try {
      const response = await fetch(`/api/athlete/competitions/${competitionId}/register`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler bei der Abmeldung');
      }

      toast.success('Erfolgreich abgemeldet');
      fetchCompetitions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler bei der Abmeldung');
    }
  };

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const upcomingCompetitions = competitions.filter((c) => new Date(c.date) >= new Date());
  const pastCompetitions = competitions.filter((c) => new Date(c.date) < new Date());

  const isRegistered = (competition: any) => competition.registrations.length > 0;
  const getRegistration = (competition: any) => competition.registrations[0];
  const canRegister = (competition: any) => {
    if (isRegistered(competition)) return false;
    if (competition.isCancelled) return false;
    if (competition.registrationDeadline && new Date() > new Date(competition.registrationDeadline))
      return false;
    if (competition.maxParticipants && competition._count.registrations >= competition.maxParticipants)
      return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Wettkämpfe</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Für Wettkämpfe anmelden und Ergebnisse einsehen
        </p>
      </div>

      {/* Upcoming Competitions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Bevorstehende Wettkämpfe</h2>
        {upcomingCompetitions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Keine bevorstehenden Wettkämpfe
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {upcomingCompetitions.map((competition) => {
              const registered = isRegistered(competition);
              const registration = registered ? getRegistration(competition) : null;

              return (
                <Card key={competition.id} className={competition.isCancelled ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-lg">{competition.name}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          {registered && (
                            <Badge variant="default">
                              <Check className="h-3 w-3 mr-1" />
                              Angemeldet
                            </Badge>
                          )}
                          {competition.isCancelled && <Badge variant="destructive">Abgesagt</Badge>}
                          {competition.requiresDtbId && <Badge variant="outline">DTB-ID erforderlich</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(competition.date)}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {competition.location}
                      </div>
                      {competition.description && (
                        <div className="flex items-start text-sm text-muted-foreground">
                          <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{competition.description}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        {competition._count.registrations} Anmeldungen
                        {competition.maxParticipants && ` / ${competition.maxParticipants} max`}
                      </div>
                      {(competition.minYouthCategory || competition.maxYouthCategory) && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Kategorien: </span>
                          {competition.minYouthCategory &&
                            YOUTH_CATEGORY_LABELS[competition.minYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                          {competition.minYouthCategory && competition.maxYouthCategory && ' - '}
                          {competition.maxYouthCategory &&
                            YOUTH_CATEGORY_LABELS[competition.maxYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                        </div>
                      )}
                      {competition.entryFee && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Startgebühr: </span>
                          {Number(competition.entryFee).toFixed(2)} €
                        </div>
                      )}
                      {competition.registrationDeadline && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Anmeldeschluss: </span>
                          {formatDate(competition.registrationDeadline)}
                        </div>
                      )}
                      {registered && registration?.notes && (
                        <div className="text-sm bg-muted p-2 rounded">
                          <span className="text-muted-foreground">Deine Notiz: </span>
                          {registration.notes}
                        </div>
                      )}
                      <div className="pt-2">
                        {registered ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnregister(competition.id)}
                            disabled={
                              competition.registrationDeadline &&
                              new Date() > new Date(competition.registrationDeadline)
                            }
                          >
                            <X className="h-4 w-4 mr-1" />
                            Abmelden
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedCompetition(competition);
                              setShowRegisterDialog(true);
                            }}
                            disabled={!canRegister(competition)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Anmelden
                          </Button>
                        )}
                        {!canRegister(competition) && !registered && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {competition.isCancelled && 'Wettkampf wurde abgesagt'}
                            {competition.registrationDeadline &&
                              new Date() > new Date(competition.registrationDeadline) &&
                              'Anmeldeschluss vorbei'}
                            {competition.maxParticipants &&
                              competition._count.registrations >= competition.maxParticipants &&
                              'Maximale Teilnehmerzahl erreicht'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Competitions */}
      {pastCompetitions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vergangene Wettkämpfe</h2>
          <div className="space-y-4">
            {pastCompetitions.map((competition) => {
              const registration = getRegistration(competition);

              return (
                <Card key={competition.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="text-base">{competition.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(competition.date)}
                      </div>
                      {registration && (
                        <div className="space-y-2 pt-2">
                          {registration.attended === true && (
                            <Badge variant="default">
                              <Check className="h-3 w-3 mr-1" />
                              Teilgenommen
                            </Badge>
                          )}
                          {registration.attended === false && (
                            <Badge variant="destructive">
                              <X className="h-3 w-3 mr-1" />
                              Nicht teilgenommen
                            </Badge>
                          )}
                          {registration.placement && (
                            <div className="flex items-center text-base font-medium">
                              <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
                              Platz {registration.placement}
                            </div>
                          )}
                          {registration.score && (
                            <div className="text-muted-foreground">
                              Punkte: {Number(registration.score).toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Registration Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Für Wettkampf anmelden</DialogTitle>
          </DialogHeader>
          {selectedCompetition && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">{selectedCompetition.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedCompetition.date)} • {selectedCompetition.location}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="z.B. benötige Mitfahrgelegenheit"
                  value={registrationNotes}
                  onChange={(e) => setRegistrationNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRegisterDialog(false);
                    setSelectedCompetition(null);
                    setRegistrationNotes('');
                  }}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleRegister} disabled={isSubmitting}>
                  {isSubmitting ? 'Wird angemeldet...' : 'Anmelden'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
