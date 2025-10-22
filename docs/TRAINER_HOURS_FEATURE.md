# Trainerstunden-Verwaltung Feature

## Übersicht

Dieses Feature ermöglicht es Admin-Benutzern, die monatlichen Arbeitsstunden aller Trainer zu verfolgen, zu verwalten und zu exportieren. Dies ist wichtig für die Gehaltsabrechnung und Dokumentation.

## Funktionen

### 1. Automatische Stundenberechnung
- Das System berechnet automatisch die Arbeitsstunden jedes Trainers basierend auf:
  - Abgeschlossenen Training-Sessions im ausgewählten Monat
  - Start- und Endzeiten der Sessions
  - Nur nicht-abgesagte Trainings werden gezählt

### 2. Manuelle Anpassungen
- Admins können die berechneten Stunden manuell anpassen
- Möglichkeit, Notizen für Anpassungen hinzuzufügen
- Audit-Trail: Wer hat wann Änderungen vorgenommen

### 3. Monatliche Navigation
- Einfache Navigation zwischen Monaten
- Übersicht über aktuelle und vergangene Monate
- Zukunftsplanung möglich

### 4. Export-Funktionen

#### CSV-Export
- Exportiert alle Trainerstunden als CSV-Datei
- Enthält: Trainername, berechnete Stunden, angepasste Stunden, finale Stunden, Anzahl Trainings, Notizen
- Dateiname: `trainer-stunden-[Monat]-[Jahr].csv`
- Geeignet für Import in Buchhaltungssoftware

#### E-Mail-Freigabe
- Öffnet Standard-E-Mail-Programm mit vorgefertigter Nachricht
- Enthält Zusammenfassung:
  - Monat und Jahr
  - Anzahl Trainer
  - Gesamtstunden
  - Detaillierte Auflistung pro Trainer
- Admin muss nur Empfänger hinzufügen und senden

## Datenbankmodell

```prisma
model MonthlyTrainerSummary {
  id                 String    @id @default(cuid())
  month              Int       // 1-12
  year               Int
  trainerId          String
  trainer            Trainer   @relation(...)
  calculatedHours    Decimal   // Automatisch berechnet
  adjustedHours      Decimal?  // Manuell angepasst
  finalHours         Decimal   // adjustedHours || calculatedHours
  notes              String?
  lastModifiedBy     String?
  lastModifiedByUser Trainer?  @relation(...)
  lastModifiedAt     DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

## API-Endpunkte

### GET /api/admin/trainer-hours
Ruft die Trainerstunden für einen bestimmten Monat ab.

**Query-Parameter:**
- `month`: Monat (0-11, 0-indiziert)
- `year`: Jahr

**Response:**
```json
{
  "month": 10,
  "year": 2025,
  "trainers": [
    {
      "id": "...",
      "trainerId": "...",
      "trainerName": "Max Mustermann",
      "calculatedHours": 45.5,
      "adjustedHours": null,
      "finalHours": 45.5,
      "notes": null,
      "lastModifiedBy": null,
      "lastModifiedAt": null,
      "sessionCount": 12
    }
  ]
}
```

### POST /api/admin/trainer-hours
Berechnet und speichert Trainerstunden für einen Monat.

**Body:**
```json
{
  "month": 10,
  "year": 2025
}
```

### PATCH /api/admin/trainer-hours
Aktualisiert die Trainerstunden (manuelle Anpassung).

**Body:**
```json
{
  "summaryId": "...",
  "adjustedHours": 50.0,
  "notes": "Zusätzliche Stunden für Wettkampfbegleitung"
}
```

### GET /api/admin/trainer-hours/export
Exportiert Trainerstunden als CSV-Datei.

**Query-Parameter:**
- `month`: Monat (0-11, 0-indiziert)
- `year`: Jahr

**Response:**
CSV-Datei mit Content-Type: `text/csv`

## UI-Komponenten

### Hauptseite: /trainer/admin/trainer-hours

**Funktionen:**
1. **Monats-Navigation**: Vor/Zurück-Buttons
2. **Zusammenfassung**: Gesamtstunden, Anzahl Trainer, Durchschnitt
3. **Aktionen-Leiste**:
   - "Stunden Berechnen" Button
   - "CSV Herunterladen" Button
   - "Per E-Mail Teilen" Button
4. **Detailtabelle**:
   - Trainer-Liste mit allen Informationen
   - Inline-Bearbeitung für Anpassungen
   - Notizen-Feld

## Workflow

### Monatliche Gehaltsabrechnung

1. **Ende des Monats:**
   - Admin navigiert zu "Trainerstunden"
   - Wählt den aktuellen Monat

2. **Stunden berechnen:**
   - Klickt auf "Stunden Berechnen"
   - System berechnet automatisch basierend auf abgeschlossenen Sessions

3. **Überprüfung und Anpassung:**
   - Überprüft die berechneten Stunden
   - Passt bei Bedarf manuell an (z.B. für Krankheit, Urlaub, Sondereinsätze)
   - Fügt Notizen hinzu

4. **Export:**
   - Lädt CSV-Datei für Buchhaltung herunter
   - ODER: Sendet direkt per E-Mail an Vereinsleitung

5. **Archivierung:**
   - Daten bleiben in der Datenbank gespeichert
   - Jederzeit wieder abrufbar für spätere Überprüfung

## Berechtigungen

- **Nur ADMIN-Benutzer** haben Zugriff auf diese Funktion
- Alle API-Endpunkte prüfen die ADMIN-Rolle
- Normale Trainer können ihre eigenen Stunden NICHT sehen oder bearbeiten

## Zeitberechnung

Die Stunden werden folgendermaßen berechnet:
- Start- und Endzeit werden aus dem Training-Session gelesen (Format: "HH:MM")
- Differenz wird in Minuten berechnet
- Umrechnung in Dezimalstunden (z.B. 1,5 Stunden)
- Nur abgeschlossene (`isCompleted: true`) und nicht abgesagte (`isCancelled: false`) Sessions werden gezählt

**Beispiel:**
- Training von 17:00 bis 18:30
- Dauer: 1,5 Stunden
- Bei 8 solcher Trainings im Monat: 12 Stunden

## Migration

Die Migration `20251022161633_add_monthly_trainer_hours` wurde erstellt und angewendet.

## Zukünftige Erweiterungen

Mögliche zukünftige Features:
- PDF-Export statt/zusätzlich zu CSV
- Automatische E-Mail-Benachrichtigung am Monatsende
- Trainer-Portal: Trainer können ihre eigenen Stunden sehen (nur Ansicht)
- Vergleich zwischen Monaten
- Jahresübersicht
- Integration mit Buchhaltungssystemen (z.B. DATEV)
- Urlaubsverwaltung
- Krankheitstage-Tracking
