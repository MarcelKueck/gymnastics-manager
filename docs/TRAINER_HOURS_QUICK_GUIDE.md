# Trainerstunden-Verwaltung - Schnellreferenz

## Zugriff
**URL:** `/trainer/admin/trainer-hours`  
**Berechtigung:** Nur ADMIN-Benutzer

## Hauptfunktionen

### 1. Stunden berechnen
- Button: **"Stunden Berechnen"**
- Berechnet automatisch die Arbeitsstunden aller Trainer für den gewählten Monat
- Basiert auf abgeschlossenen, nicht-abgesagten Trainings
- Speichert die Daten in der Datenbank

### 2. Monatliche Navigation
- **"Vorheriger Monat"** / **"Nächster Monat"** Buttons
- Aktuelle Ansicht zeigt Monat und Jahr
- Anzahl der Trainer wird angezeigt

### 3. Stunden anpassen
- Klick auf **"Bearbeiten"** (Stift-Icon) in der Zeile eines Trainers
- Felder erscheinen:
  - **Angepasste Stunden:** Manuelle Stundenzahl (leer = automatisch berechnet)
  - **Notizen:** Begründung für Anpassung
- Speichern mit **"Speichern"** (Disketten-Icon)
- Abbrechen mit **"X"**

### 4. CSV exportieren
- Button: **"CSV Herunterladen"**
- Erstellt eine CSV-Datei mit allen Trainerstunden
- Dateiname: `trainer-stunden-[Monat]-[Jahr].csv`
- Enthält: Trainer, Berechnete Stunden, Angepasste Stunden, Finale Stunden, Anzahl Trainings, Notizen

### 5. Per E-Mail teilen
- Button: **"Per E-Mail Teilen"**
- Öffnet Standard-E-Mail-Programm
- Vorgefertigter Betreff: "Trainerstunden [Monat] [Jahr]"
- Vorgefertigter Text mit:
  - Monat und Jahr
  - Anzahl Trainer
  - Gesamtstunden
  - Detaillierte Liste aller Trainer mit Stunden
- Admin muss nur Empfänger eintragen und CSV-Datei anhängen

## Tabellen-Spalten

| Spalte | Beschreibung |
|--------|-------------|
| **Trainer** | Name des Trainers + Info wer es zuletzt bearbeitet hat |
| **Trainings** | Anzahl der abgeschlossenen Trainings |
| **Berechnet** | Automatisch berechnete Stunden |
| **Angepasst** | Manuell angepasste Stunden (orange markiert) |
| **Final** | Finale Stunden (fett) - entweder angepasst oder berechnet |
| **Notizen** | Begründung für Anpassungen |
| **Aktionen** | Bearbeiten-Button |

## Zusammenfassung-Karten

- **Gesamtstunden:** Summe aller finalen Stunden
- **Aktive Trainer:** Anzahl der Trainer im System
- **Durchschnitt pro Trainer:** Gesamtstunden / Anzahl Trainer

## Workflow: Monatsabrechnung

1. **Monat auswählen** (Ende des Monats warten)
2. **"Stunden Berechnen"** klicken
3. **Daten überprüfen** - sind alle Werte korrekt?
4. **Anpassen bei Bedarf** (Urlaub, Krankheit, Sondereinsätze)
5. **Export:**
   - **CSV herunterladen** für Buchhaltung/Excel
   - **ODER per E-Mail teilen** direkt an Vereinsleitung

## Wichtige Hinweise

✅ Nur abgeschlossene Trainings werden gezählt  
✅ Abgesagte Trainings werden NICHT gezählt  
✅ Daten bleiben gespeichert und können jederzeit wieder aufgerufen werden  
✅ Änderungen werden protokolliert (wer hat wann geändert)  
✅ Zeitformat: Dezimalstunden (z.B. 1,5 Stunden für 1:30h)

## Beispiel-Berechnung

Training von 17:00 bis 18:30 Uhr:
- Dauer: 1,5 Stunden
- Bei 8 Trainings im Monat: **12 Stunden**

Training von 18:30 bis 20:00 Uhr:
- Dauer: 1,5 Stunden
- Bei 8 Trainings im Monat: **12 Stunden**

**Gesamt:** 24 Stunden pro Monat (bei 2 Trainings/Woche à 1,5h)

## Anpassungs-Beispiele

**Urlaub:**
- Trainer hatte 2 Wochen Urlaub
- Berechnet: 24 Stunden
- Angepasst: 12 Stunden
- Notiz: "2 Wochen Urlaub abgezogen"

**Zusätzliche Stunden:**
- Trainer hat Wettkampf begleitet
- Berechnet: 24 Stunden
- Angepasst: 32 Stunden
- Notiz: "8 Stunden für Wettkampfbegleitung hinzugefügt"

**Krankheit:**
- Trainer war 1 Woche krank
- Berechnet: 24 Stunden
- Angepasst: 18 Stunden
- Notiz: "1 Woche Krankheit abgezogen"

## Fehlerbehebung

**Problem:** Keine Stunden angezeigt  
**Lösung:** Erst auf "Stunden Berechnen" klicken

**Problem:** Trainer fehlt in der Liste  
**Lösung:** Trainer muss als "aktiv" markiert sein

**Problem:** Zu wenig/viele Stunden  
**Lösung:** Prüfen Sie, ob alle Trainings als "abgeschlossen" markiert sind

**Problem:** CSV-Download funktioniert nicht  
**Lösung:** Browser-Popup-Blocker deaktivieren

**Problem:** E-Mail öffnet sich nicht  
**Lösung:** Standard-E-Mail-Programm muss eingerichtet sein (z.B. Outlook, Thunderbird)
