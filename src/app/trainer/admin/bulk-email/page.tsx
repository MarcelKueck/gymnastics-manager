'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loading } from '@/components/ui/loading';
import { PageHeader } from '@/components/shared';
import {
  Mail,
  Send,
  Users,
  UserCheck,
  UsersRound,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface RecipientCounts {
  athleteCount: number;
  trainerCount: number;
  groupCount: number;
}

interface Group {
  id: string;
  name: string;
  athleteCount: number;
}

interface Athlete {
  id: string;
  name: string;
  email: string;
}

export default function AdminBulkEmailPage() {
  const [counts, setCounts] = useState<RecipientCounts | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [recipientType, setRecipientType] = useState('all_athletes');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRecipientCounts();
  }, []);

  useEffect(() => {
    if (recipientType === 'groups') {
      fetchGroups();
    } else if (recipientType === 'selected') {
      fetchAthletes();
    }
  }, [recipientType]);

  const fetchRecipientCounts = async () => {
    try {
      const res = await fetch('/api/admin/bulk-email');
      if (res.ok) {
        const data = await res.json();
        setCounts(data.data);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/admin/bulk-email?type=groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchAthletes = async () => {
    try {
      const res = await fetch('/api/admin/bulk-email?type=athletes');
      if (res.ok) {
        const data = await res.json();
        setAthletes(data.data);
      }
    } catch (error) {
      console.error('Error fetching athletes:', error);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ success: false, message: 'Bitte füllen Sie Betreff und Nachricht aus' });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          recipientType,
          groupIds: recipientType === 'groups' ? selectedGroups : undefined,
          athleteIds: recipientType === 'selected' ? selectedAthletes : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message });
        // Reset form on success
        setSubject('');
        setMessage('');
        setSelectedGroups([]);
        setSelectedAthletes([]);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: 'Fehler beim Senden der E-Mail' });
    } finally {
      setIsSending(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleAthlete = (athleteId: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  const selectAllGroups = () => {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map((g) => g.id));
    }
  };

  const selectAllAthletes = () => {
    if (selectedAthletes.length === athletes.length) {
      setSelectedAthletes([]);
    } else {
      setSelectedAthletes(athletes.map((a) => a.id));
    }
  };

  const getEstimatedRecipients = () => {
    switch (recipientType) {
      case 'all_athletes':
        return counts?.athleteCount || 0;
      case 'all_trainers':
        return counts?.trainerCount || 0;
      case 'all':
        return (counts?.athleteCount || 0) + (counts?.trainerCount || 0);
      case 'groups':
        return groups
          .filter((g) => selectedGroups.includes(g.id))
          .reduce((sum, g) => sum + g.athleteCount, 0);
      case 'selected':
        return selectedAthletes.length;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return <Loading text="Lade..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="E-Mails"
        description="Senden Sie E-Mails an alle oder ausgewählte Mitglieder"
      />

      {/* Recipient Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Aktive Athleten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.athleteCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Aktive Trainer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.trainerCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              Trainingsgruppen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.groupCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Result Message */}
      {result && (
        <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="py-4 flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Email Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail verfassen
          </CardTitle>
          <CardDescription>
            Wählen Sie die Empfänger und verfassen Sie Ihre Nachricht
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recipient Type Selection */}
          <div className="space-y-2">
            <Label>Empfänger</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_athletes">
                  Alle Athleten ({counts?.athleteCount || 0})
                </SelectItem>
                <SelectItem value="all_trainers">
                  Alle Trainer ({counts?.trainerCount || 0})
                </SelectItem>
                <SelectItem value="all">
                  Alle Mitglieder ({(counts?.athleteCount || 0) + (counts?.trainerCount || 0)})
                </SelectItem>
                <SelectItem value="groups">Bestimmte Trainingsgruppen</SelectItem>
                <SelectItem value="selected">Ausgewählte Athleten</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Group Selection */}
          {recipientType === 'groups' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Trainingsgruppen auswählen</Label>
                <Button variant="ghost" size="sm" onClick={selectAllGroups}>
                  {selectedGroups.length === groups.length ? 'Keine' : 'Alle'} auswählen
                </Button>
              </div>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={group.id}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <label
                      htmlFor={group.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {group.name} ({group.athleteCount} Athleten)
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Athlete Selection */}
          {recipientType === 'selected' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Athleten auswählen</Label>
                <Button variant="ghost" size="sm" onClick={selectAllAthletes}>
                  {selectedAthletes.length === athletes.length ? 'Keine' : 'Alle'} auswählen
                </Button>
              </div>
              <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-2">
                {athletes.map((athlete) => (
                  <div key={athlete.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={athlete.id}
                      checked={selectedAthletes.includes(athlete.id)}
                      onCheckedChange={() => toggleAthlete(athlete.id)}
                    />
                    <label
                      htmlFor={athlete.id}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {athlete.name}
                      <span className="text-muted-foreground ml-2 text-xs">
                        ({athlete.email})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Content */}
          <div className="space-y-2">
            <Label htmlFor="subject">Betreff</Label>
            <Input
              id="subject"
              placeholder="E-Mail Betreff..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <textarea
              id="message"
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ihre Nachricht..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Send Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Geschätzte Empfänger: <strong>{getEstimatedRecipients()}</strong>
            </p>
            <Button
              onClick={handleSend}
              disabled={isSending || getEstimatedRecipients() === 0}
            >
              {isSending ? (
                <>Sende...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  E-Mail senden
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
