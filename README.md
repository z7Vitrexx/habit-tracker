# Habit Tracker Pro

Eine moderne, lokal laufende Habit-Tracker PWA mit Passwortschutz und Verschlüsselung.

## 🎯 Was ist Habit Tracker Pro?

Habit Tracker Pro ist eine **local-first** Web-App, die es ermöglicht, Gewohnheiten privat und sicher zu tracken. Die App läuft vollständig im Browser, benötigt **keine Backend-Infrastruktur** und speichert alle Daten **lokal auf deinem Gerät**.

### 🌟 Warum diese App?

- **🔐 100% Privat** - Deine Daten verlassen niemals dein Gerät
- **� Echt verschlüsselt** - Militärischer Passwortschutz mit AES-256
- **📱 Installierbar** - Funktioniert wie eine native App
- **📊 Umfassend** - Streaks, Statistiken, Trends und Fortschritt
- **📱 Offline-fähig** - Funktioniert ohne Internetverbindung
- **🆓 Kostenlos** - Keine Abonnements, keine Datenverkäufe

### ✨ Hauptfunktionen

- **🔐 Mehrere Profile** - Jedes Profil mit eigenem Passwort geschützt
- **🔒 Ende-zu-Ende-Verschlüsselung** - Web Crypto API mit PBKDF2 + AES-GCM
- **📱 PWA-Installierbar** - Auf Desktop und Mobile installierbar
- **📊 Umfassende Statistiken** - Streaks, Completion Rates, Trends, Charts
- **📅 Flexible Frequenzen** - Täglich, wöchentlich, x-mal pro Woche, custom
- **✅ Schnelle Check-ins** - Erledigt, übersprungen, verpasst
- **📝 Notizen & Werte** - Optionale Notizen und quantitative Werte
- **📈 Verlaufsansicht** - Kalender- und Listenansicht für alle Einträge
- **⚙️ Umfassende Einstellungen** - Theme, Auto-Lock, Import/Export
- **📤 Daten-Import/Export** - JSON-basierter Datenaustausch
- **🔔 Lokale Erinnerungen** - Browser-Benachrichtigungen (mit technischen Grenzen)

## 🛡️ Datenschutz & Sicherheit

### Lokales Sicherheitsmodell

Diese App verwendet **echten lokalen Passwortschutz**:

- **🔐 Keine Klartext-Passwörter** - Werden niemals im Klartext gespeichert
- **🔑 PBKDF2 Key-Derivation** - 100.000 Iterationen mit zufälligem Salt
- **🔒 AES-GCM Verschlüsselung** - Industriestandard für symmetrische Verschlüsselung
- **💾 Lokale Speicherung** - Alle Daten bleiben auf deinem Gerät
- **🔄 Ehrliche UX** - Keine falschen Versprechen über Passwort-Wiederherstellung

⚠️ **Wichtig:** Bei Verlust des Passworts sind die verschlüsselten Daten **nicht wiederherstellbar**.

### Was bedeutet "Local-First"?

- **🚫 Kein Cloud-Sync** - Deine Daten werden nicht in der Cloud gespeichert
- **🚫 Keine Tracker** - Die App sammelt keine Nutzerdaten
- **🚫 Keine Server** - Alles läuft lokal in deinem Browser
- **✅ Volle Kontrolle** - Du bestimmst, was mit deinen Daten passiert

## 🚀 Schnellstart

### Installation

```bash
# 1. Repository klonen
git clone <repository-url>
cd habit-tracker

# 2. Abhängigkeiten installieren
npm install --legacy-peer-deps

# 3. Entwicklungsserver starten
npm run dev

# 4. Build für Produktion
npm run build

# 5. Preview starten
npm run preview
```

### Erste Schritte

1. **Profil erstellen** - Beim ersten Start wird ein Profil mit Passwort erstellt
2. **Gewohnheiten anlegen** - Erstelle deine ersten Gewohnheiten mit Frequenz und Zielen
3. **Check-ins durchführen** - Markiere tägliche Fortschritte im Dashboard
4. **Statistiken ansehen** - Analysiere deine Fortschritte und Trends

## 📱 PWA Installation

### ⚠️ Wichtiger Hinweis (v1.1)

**PWA-Installation funktioniert nur mit dem Production Build!**

```bash
# Production Build starten
npm run build
npx serve dist -l 4173
# Dann: http://localhost:4173 aufrufen
```

**Im Dev-Modus (`npm run dev`) erscheint kein Install-Button** (normales PWA-Verhalten).

### Desktop (Chrome/Edge/Brave)

1. **Production Build öffnen:** `http://localhost:4173`
2. **Install-Button suchen:** In App (Header) oder Browser-Adressleiste
3. **Installieren:** Klick auf "Installieren" oder Browser-Symbol
4. **Ergebnis:** App öffnet sich in eigenem Fenster ohne Browser-Leiste

### Mobile (Android)

1. **Production Build öffnen:** `http://localhost:4173` in Chrome
2. **Install-Prompt warten:** Unten erscheint "App installieren"
3. **Installieren:** Klick auf "Installieren"
4. **Ergebnis:** App-Icon erscheint auf Homescreen

### iOS (iPhone/iPad)

1. **Production Build öffnen:** `http://localhost:4173` in Safari
2. **Teilen-Button:** ⚡️ unten in Safari
3. **"Zum Home-Bildschirm hinzufügen"**
4. **Hinzufügen:** Bestätigen
5. **Ergebnis:** App-Icon erscheint auf Homescreen

## 🔔 Erinnerungen - Technische Grenzen

### Was funktioniert

- **🔔 Browser-Benachrichtigungen** - Lokale Benachrichtigungen im aktiven Browser
- **⏰ Zeitbasierte Erinnerungen** - Gewünschte Zeiten werden eingehalten
- **🎯 Habit-spezifisch** - Jeder Habit kann eigene Erinnerungszeiten haben
- **📱 Mobile Unterstützung** - Funktioniert auf Android und iOS

### Was sind die Grenzen?

- **🚫 Nur im aktiven Browser** - Erinnerungen funktionieren nur, wenn der Browser läuft
- **🚫 Keine systemweiten Erinnerungen** - Wie native Apps (z.B. iOS Reminders)
- **🚫 Browser-spezifisch** - Erinnerungen sind an den Browser gebunden
- **🚫 Keine Garantie** - Betriebssysteme können Browser-Benachrichtigungen blockieren

💡 **Tipp:** Die App zeigt ehrliche Hinweise zu diesen Grenzen in den Einstellungen.

## 📤 Import/Export

### Warum brauchst du Import/Export?

Da alles lokal gespeichert wird, musst du deine Daten selbst sichern:

- **🔄 Gerätewechsel** - Daten vom alten auf neues Gerät übertragen
- **💾 Backup** - Regelmäßige Sicherung deiner Fortschritte
- **📱 Plattformwechsel** - Von Desktop zu Mobile oder umgekehrt
- **🔒 Notfall** - Bei Problemen mit dem lokalen Speicher

### Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-01T00:00:00.000Z",
  "profile": {
    "name": "Max Mustermann",
    "avatarColor": "#3b82f6",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "data": {
    "habits": [...],
    "checkIns": [...],
    "categories": [...],
    "settings": {...},
    "reminders": [...]
  }
}
```

### Sicherheit bei Import/Export

- **✅ Zod-Validierung** - Importierte Daten werden auf Korrektheit geprüft
- **✅ Versions-Kompatibilität** - Nur kompatible Dateiformate werden akzeptiert
- **✅ Sicherheitsabfrage** - Import überschreibt alle aktuellen Daten
- **✅ Profil-Trennung** - Daten können nur im richtigen Profil importiert werden

## 🏗️ Tech-Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Datenbank:** Dexie (IndexedDB Wrapper)
- **Verschlüsselung:** Web Crypto API
- **Charts:** Recharts
- **Icons:** Lucide React
- **PWA:** Vite PWA Plugin
- **Validierung:** Zod
- **Datumsfunktionen:** date-fns

## 📁 Projektstruktur

```
src/
├── components/          # React Komponenten
│   ├── ui/              # shadcn/ui Basis-Komponenten
│   ├── AppLayout.tsx    # Haupt-Layout mit Navigation
│   ├── Dashboard.tsx    # Dashboard mit schnellen Check-ins
│   ├── Habits.tsx       # Habit-Verwaltung
│   ├── Statistics.tsx   # Statistiken und Visualisierungen
│   ├── History.tsx      # Verlaufsansicht
│   ├── Settings.tsx     # Einstellungen
│   └── ProfileSelection.tsx # Profil-Auswahl
├── hooks/               # React Hooks
│   ├── useAuth.ts       # Authentifizierung und Profil-Management
│   ├── useCheckIns.ts   # Check-In Logik und Statistiken
│   └── useReminders.ts  # Erinnerungs-Logik
├── contexts/            # React Contexts
│   ├── AuthContext.tsx  # Authentifizierungs-Context
│   └── ReminderContext.tsx # Erinnerungs-Context
├── lib/                 # Utility-Bibliotheken
│   ├── crypto.ts        # Verschlüsselungs-Logik
│   └── utils.ts         # Allgemeine Utilities
├── db/                  # Datenbank-Konfiguration
│   └── index.ts         # Dexie Setup
├── types/               # TypeScript Typen
│   └── index.ts         # Alle Typ-Definitionen
└── App.tsx              # Haupt-App-Komponente
```

## 🔧 Konfiguration

### Environment-Variablen

Die App benötigt keine Environment-Variablen - alles läuft lokal.

### Build-Konfiguration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({...})]
})
```

## 🧪 Tests

```bash
# Typecheck
npx tsc --noEmit

# Build
npm run build

# Lint
npm run lint
```

## 📱 PWA Features

Die App ist als Progressive Web App konfiguriert:

- **📱 Installierbar** - Kann auf dem Homescreen installiert werden
- **📴 Offline-fähig** - Funktioniert ohne Internetverbindung
- **🔄 Auto-Update** - Service Worker mit automatischen Updates
- **🎨 App-like Experience** - Vollbildmodus ohne Browser-UI
- **💾 Caching** - Intelligentes Caching für Performance

## 🔒 Sicherheitshinweise

### Passwort-Sicherheit

- **🔐 Mindestens 8 Zeichen** - Verwende sichere Passwörter
- **🔄 Keine Wiederherstellung** - Bei Verlust sind Daten verloren
- **💾 Lokal verschlüsselt** - Passwörter werden niemals unverschlüsselt gespeichert
- **🚫 Keine Recovery** - Es gibt keine "Passwort vergessen" Funktion

### Daten-Sicherheit

- **🔒 Verschlüsselt** - Alle Profildaten sind AES-256 verschlüsselt
- **💾 Lokal** - Daten verlassen niemals dein Gerät
- **👤 Profil-Trennung** - Profile sind vollständig voneinander getrennt
- **� Session-basiert** - Entschlüsselte Daten existieren nur im RAM

## 🎨 Design-Prinzipien

- **🎯 Modern & Minimalistisch** - Klare, ruhige Oberfläche
- **🎨 Hochwertig** - Sorgfältige Typografie und Abstände
- **♿ Zugänglich** - Tastaturbedienung und Screenreader-Unterstützung
- **📱 Responsive** - Optimiert für Desktop und Mobile
- **🇩🇪 Deutsch** - Deutsche UI-Sprache für bessere Usability

## 🔄 Daten-Migrationen

Die App unterstützt Schema-Versionierung für zukünftige Updates:

```typescript
// Aktuelle Version: 1.0
// Zukünftige Versionen werden automatisch migriert
```

## 🤝 Beitrag

1. Fork das Projekt
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Commit deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt steht unter der MIT Lizenz.

## 🐛 Troubleshooting

### Build-Probleme

Bei Build-Fehlern mit Peer-Dependency-Konflikten:

```bash
npm install --legacy-peer-deps
```

### PWA Installation

Falls die PWA nicht installierbar ist:

1. **Production Build verwenden** - `npm run build && npx serve dist`
2. **HTTPS prüfen** - Im Development ist localhost ausgenommen
3. **Service Worker** - Muss korrekt registriert sein (nur in Production)
4. **Manifest prüfen** - Muss valide sein und PNG-Icons enthalten
5. **Browser-Cache** - Cache leeren und neu laden
6. **Console prüfen** - `[PWA] beforeinstallprompt received` muss erscheinen

### Verschlüsselungsprobleme

Bei Passwort-Problemen:

1. **Browser-Kompatibilität** - Web Crypto API wird benötigt
2. **Passwort-Stärke** - Verwende sichere Passwörter
3. **localStorage** - Beschädigte Daten können Probleme verursachen

### Erinnerungsprobleme

Bei nicht funktionierenden Erinnerungen:

1. **Permission prüfen** - Browser-Benachrichtigungen müssen erlaubt sein
2. **Browser aktiv** - Erinnerungen funktionieren nur im aktiven Browser
3. **System-Einstellungen** - Betriebssystem kann Benachrichtigungen blockieren

## 📞 Support

Bei Problemen oder Fragen:

1. **Issues prüfen** - [GitHub Issues](../../issues) für bekannte Probleme
2. **Neues Issue** - Erstelle ein Issue mit detaillierter Beschreibung
3. **Screenshots** - Füge Screenshots und Console-Logs bei
4. **Browser-Info** - Gib Browser und Version an

---

**🔒 Wichtiger Hinweis:** Dies ist eine lokale Anwendung. Deine Daten verlassen niemals dein Gerät. Du bist allein verantwortlich für die Sicherung deiner Daten.

**🎯 Ziel:** Eine private, sichere und funktionale Habit-Tracking App ohne Kompromisse beim Datenschutz.
