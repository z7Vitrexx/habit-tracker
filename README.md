# Habit Tracker Pro

Eine local-first Habit-Tracking App mit Profilen, Passwortschutz, Statistiken, Verlauf, Erinnerungen und PWA-Unterstützung. Alle Daten bleiben lokal im Browser – kein Backend, kein Cloud-Sync.

## Live-Demo

Die öffentliche Testversion ist unter folgender URL erreichbar:

**[habit-tracker-demo.vercel.app](https://habit-tracker-demo.vercel.app)**

Diese Seite enthält ein vorbereitetes Demo-Profil mit Beispieldaten (6 Habits, 30 Tage Check-in-Verlauf). Die Daten werden lokal in deinem Browser gespeichert. Änderungen betreffen nur deine eigene lokale Kopie – andere Besucher sehen davon nichts.

### Demo-Zugang

- **Profil:** `Demo`
- **Passwort:** `demo1234`

Nach dem Öffnen der Demo-Seite wird das Demo-Profil automatisch vorausgewählt. Gib das Passwort ein, um die App mit den Beispieldaten zu erkunden.

## Funktionen

- **Profile** – Mehrere Profile mit jeweils eigenem Passwort (AES-256 verschlüsselt)
- **Habits** – Binäre (erledigt/nicht erledigt) und quantitative Habits (mit Zahlenwert)
- **Frequenzen** – Täglich, wöchentlich, x-mal pro Woche, benutzerdefiniert
- **Check-ins** – Erledigt, übersprungen oder verpasst – mit optionaler Notiz
- **Dashboard** – Tagesübersicht mit schnellen Check-ins und Fortschrittsanzeige
- **Verlauf** – Kalender- und Listenansicht aller bisherigen Einträge
- **Statistik** – Streaks, Completion Rates, Wochen-Trends, Charts
- **Kategorien** – Habits nach Themen gruppieren
- **Import/Export** – JSON-basiertes Backup und Wiederherstellen
- **Erinnerungen** – Lokale Browser-Benachrichtigungen (mit technischen Grenzen, siehe unten)
- **PWA** – Installierbar auf Desktop und Mobile, offline-fähig
- **Onboarding** – Starter-Templates für schnellen Einstieg

## Wichtige Hinweise

- Alle Daten werden **ausschließlich lokal** im Browser gespeichert (IndexedDB)
- Es gibt **keinen Cloud-Sync** und keine Server-Verbindung
- Bei Verlust des Passworts sind verschlüsselte Daten **nicht wiederherstellbar**
- **Regelmäßige Backups** über Einstellungen → Datenverwaltung werden empfohlen
- Erinnerungen funktionieren nur im aktiven Browser und sind system-/browserabhängig
- Daten sind an den jeweiligen Browser und das Gerät gebunden

## Voraussetzungen

- **Node.js** 18+ (empfohlen: 20+)
- **npm** 9+
- **Moderner Browser** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

## Lokal starten

```bash
# Repository klonen
git clone https://github.com/z7Vitrexx/habit-tracker.git
cd habit-tracker

# Abhängigkeiten installieren
npm install --legacy-peer-deps

# Entwicklungsserver starten
npm run dev
```

Die App läuft dann unter `http://localhost:5173`.

## Build und Preview

```bash
# Production Build erstellen
npm run build

# Production Preview starten (PWA-fähig)
npm run preview
```

Die Preview läuft unter `http://localhost:4173`. Die PWA-Installation funktioniert nur im Production Build.

## Demo-Modus lokal aktivieren

Der Demo-Modus wird über die Umgebungsvariable `VITE_DEMO_MODE` gesteuert:

```bash
# .env Datei im Projektroot erstellen oder anpassen
VITE_DEMO_MODE=true
```

- **Mit `VITE_DEMO_MODE=true`:** Beim ersten Besuch wird automatisch ein Demo-Profil mit Beispieldaten angelegt. Bestehende lokale Daten werden nicht überschrieben.
- **Ohne diese Variable (Standard):** Normale Version ohne Demo-Inhalte. Der Nutzer erstellt sein eigenes Profil.

Die öffentliche Vercel-Demo verwendet `VITE_DEMO_MODE=true`. Für lokale Entwicklung ohne Demo-Daten die Variable weglassen oder auf `false` setzen.

## Nutzung

1. **Profil erstellen** – Beim ersten Start ein Profil mit Name und Passwort anlegen
2. **Habits anlegen** – Neue Gewohnheiten mit Name, Frequenz, Kategorie und Typ erstellen
3. **Check-ins** – Im Dashboard tägliche Fortschritte markieren (Erledigt / Verpasst / Übersprungen)
4. **Verlauf** – Alle bisherigen Check-ins in Kalender- oder Listenansicht einsehen
5. **Statistik** – Streaks, Trends und Completion Rates analysieren
6. **Backup** – Unter Einstellungen → Datenverwaltung Daten exportieren und importieren

## PWA-Installation

Die App kann wie eine native App installiert werden:

- **Desktop (Chrome/Edge):** Install-Button in der App oder in der Browser-Adressleiste
- **Android (Chrome):** Automatischer Install-Prompt oder über Browser-Menü
- **iOS (Safari):** Teilen-Button → „Zum Home-Bildschirm hinzufügen"

Die PWA-Installation funktioniert nur mit dem Production Build (`npm run build && npm run preview`). Im Dev-Modus erscheint kein Install-Button.

## Öffentliche Demo vs. normale Version

| | Demo-Version | Normale Version |
|---|---|---|
| **Demo-Profil** | Automatisch angelegt mit Beispieldaten | Kein Demo-Profil |
| **Erste Schritte** | Demo-Profil auswählen und mit `demo1234` einloggen | Eigenes Profil erstellen |
| **Habits** | 6 Beispiel-Habits mit 30 Tagen Verlauf | Eigene Habits anlegen |
| **Daten** | Lokal im Browser, nur für diesen Besucher | Lokal im Browser |
| **Steuerung** | `VITE_DEMO_MODE=true` | Ohne diese Variable |

Beide Versionen sind funktional identisch. Die Demo-Version enthält lediglich vorbereitete Beispieldaten.

## Bekannte Grenzen

- **Kein Cloud-Sync** – Daten existieren nur im lokalen Browser
- **Gerätegebunden** – Daten sind an Browser und Gerät gebunden
- **Gerätewechsel** – Nur über Export/Import möglich
- **Erinnerungen** – Funktionieren nur im aktiven Browser, keine systemweiten Push-Benachrichtigungen
- **Passwort-Recovery** – Bei Passwortverlust sind Daten nicht wiederherstellbar
- **Browser-Cache** – Bei gelöschtem Cache oder gelöschten Browserdaten gehen lokale Daten verloren

## Troubleshooting

### PWA- und Cache-Probleme

- Browser-Cache und Application Storage leeren
- Seite neu laden
- PWA deinstallieren und neu installieren
- PWA-Installation nur mit Production Build möglich

### Benachrichtigungen funktionieren nicht

- Browser-Benachrichtigungen müssen erlaubt sein (Browser-Einstellungen)
- Erinnerungen funktionieren nur im aktiven Browser
- Betriebssystem kann Benachrichtigungen blockieren
- Testen über Einstellungen → Reminder-Übersicht → Testbenachrichtigung

### Datenprobleme

- Daten sind browserspezifisch – anderer Browser = andere Daten
- Bei beschädigten Daten: Backup wiederherstellen oder Profil neu erstellen
- Regelmäßig Backups erstellen (Einstellungen → Datenverwaltung)

### Build-Probleme

```bash
# Bei Peer-Dependency-Konflikten
npm install --legacy-peer-deps

# Typecheck
npx tsc --noEmit

# Build testen
npm run build
```

## Entwicklung

```bash
npm run dev          # Entwicklungsserver mit Hot-Reload
npm run build        # Production Build
npm run preview      # Production Preview
npx tsc --noEmit     # TypeScript-Check
npm run lint         # Linting
```

### Tech-Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Datenbank:** Dexie (IndexedDB)
- **Verschlüsselung:** Web Crypto API (PBKDF2 + AES-GCM)
- **Charts:** Recharts
- **Icons:** Lucide React
- **PWA:** Vite PWA Plugin
- **Validierung:** Zod
- **Datum:** date-fns

## Lizenz

MIT
