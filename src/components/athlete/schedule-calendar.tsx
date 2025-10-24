'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, getDayOfWeekGerman } from '@/lib/utils';
import { Calendar, Clock, MapPin, Users, Edit, CheckCircle2, XCircle } from 'lucide-react';

interface Session {
  id: string;
  date: Date;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurringTraining?: {
    name: string;
  };
  isCancelled: boolean;
  cancellations?: Array<{
    id: string;
    reason: string;
    isActive: boolean;
  }>;
  attendanceRecords?: Array<{
    status: string;
  }>;
}

interface ScheduleCalendarProps {
  sessions: Session[];
  onCancelSession?: (sessionId: string) => void;
  onEditCancellation?: (cancellationId: string, session: Session) => void;
  deadlineHours?: number;
}

// Check if session can be modified (deadline hours before start)
function canModifySession(session: Session, deadlineHours: number = 2): boolean {
  const sessionDateTime = new Date(session.date);
  const startTime = session.startTime || '00:00';
  const [hours, minutes] = startTime.split(':').map(Number);
  sessionDateTime.setHours(hours, minutes, 0, 0);
  
  const deadline = new Date(sessionDateTime.getTime() - deadlineHours * 60 * 60 * 1000);
  return new Date() < deadline;
}

export function ScheduleCalendar({ sessions, onCancelSession, onEditCancellation, deadlineHours = 2 }: ScheduleCalendarProps) {
  const groupedSessions = sessions.reduce((acc, session) => {
    const dateKey = formatDate(session.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const getSessionStatus = (session: Session) => {
    // Check if attended
    if (session.attendanceRecords && session.attendanceRecords.length > 0) {
      const status = session.attendanceRecords[0].status;
      return {
        type: 'attended',
        label: status === 'PRESENT' ? 'Anwesend' : status === 'ABSENT_EXCUSED' ? 'Entschuldigt' : 'Unentschuldigt',
        variant: status === 'PRESENT' ? 'success' : 'secondary',
        icon: status === 'PRESENT' ? CheckCircle2 : XCircle,
      };
    }

    // Check if cancelled by athlete
    const activeCancellation = session.cancellations?.find(c => c.isActive);
    if (activeCancellation) {
      return {
        type: 'cancelled',
        label: 'Von dir abgesagt',
        variant: 'warning',
        icon: XCircle,
        cancellationId: activeCancellation.id,
        reason: activeCancellation.reason,
      };
    }

    // Check if session is cancelled
    if (session.isCancelled) {
      return {
        type: 'session-cancelled',
        label: 'Abgesagt',
        variant: 'destructive',
        icon: XCircle,
      };
    }

    // Future session
    if (new Date(session.date) > new Date()) {
      return {
        type: 'upcoming',
        label: 'Geplant',
        variant: 'default',
        icon: CheckCircle2,
      };
    }

    // Past session without attendance
    return {
      type: 'unknown',
      label: 'Ausstehend',
      variant: 'secondary',
      icon: Clock,
    };
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {Object.entries(groupedSessions).map(([date, daySessions]) => (
        <Card key={date}>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 flex-shrink-0" />
              <span className="truncate">{date} - {getDayOfWeekGerman(daySessions[0].dayOfWeek)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {daySessions.map((session) => {
                const status = getSessionStatus(session);
                const StatusIcon = status.icon;
                const canModify = canModifySession(session, deadlineHours);

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 p-3 md:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm md:text-base truncate flex-shrink-0">
                          {session.recurringTraining?.name || 'Training'}
                        </h4>
                        <Badge variant={status.variant as any} className="flex-shrink-0">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          <span className="text-xs">{status.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-gray-500">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      {status.type === 'cancelled' && status.reason && canModify && (
                        <p className="text-xs text-muted-foreground mt-2 break-words">
                          Grund: {status.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
                      {status.type === 'cancelled' && canModify && onEditCancellation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditCancellation(status.cancellationId!, session)}
                          className="w-full sm:w-auto justify-center touch-target"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Bearbeiten
                        </Button>
                      )}
                      {status.type === 'upcoming' &&
                        !session.isCancelled &&
                        canModify &&
                        onCancelSession && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onCancelSession(session.id)}
                            className="w-full sm:w-auto justify-center touch-target"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Absagen
                          </Button>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      {Object.keys(groupedSessions).length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-sm md:text-base text-muted-foreground">
            Keine Trainingseinheiten gefunden
          </CardContent>
        </Card>
      )}
    </div>
  );
}