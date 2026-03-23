// Test-Skript für Import/Export Validierung
// Dieses Skript testet alle wichtigen Import/Export Szenarien

const fs = require('fs');

// Test 1: Gültige Export-Struktur
const validExportData = {
  version: '1.0',
  exportedAt: '2026-03-23T10:00:00.000Z',
  profile: {
    name: 'TestProfil',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  data: {
    habits: [
      {
        id: 'habit-1',
        name: 'Sport',
        description: 'Täglich 30 Minuten Sport',
        color: '#3b82f6',
        icon: '🏃',
        category: 'Gesundheit',
        startDate: '2026-01-01',
        status: 'active',
        type: 'binary',
        frequency: {
          type: 'daily'
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ],
    checkIns: [
      {
        id: 'checkin-1',
        habitId: 'habit-1',
        date: '2026-03-23',
        status: 'done',
        note: 'Super Training!',
        createdAt: '2026-03-23T10:00:00.000Z',
        updatedAt: '2026-03-23T10:00:00.000Z'
      }
    ],
    categories: [
      {
        id: 'cat-1',
        name: 'Gesundheit',
        color: '#10b981',
        createdAt: '2026-01-01T00:00:00.000Z'
      }
    ],
    settings: {
      weekStart: 'monday',
      theme: 'system',
      autoLockMinutes: 30,
      notifications: true
    },
    reminders: [
      {
        id: 'reminder-1',
        habitId: 'habit-1',
        time: '08:00',
        enabled: true
      }
    ]
  }
};

// Test 2: Ungültige JSON-Datei
const invalidJson = '{ "version": "1.0", "invalid": json }';

// Test 3: Unvollständige Daten
const incompleteData = {
  version: '1.0',
  exportedAt: '2026-03-23T10:00:00.000Z',
  profile: {
    name: 'TestProfil'
    // Fehlt: createdAt
  },
  data: {
    // Fehlen: habits, checkIns, categories, settings, reminders
  }
};

// Test 4: Falsche Version
const wrongVersion = {
  ...validExportData,
  version: '2.0'
};

// Test 5: Inkompatible Struktur
const incompatibleStructure = {
  version: '1.0',
  exportedAt: '2026-03-23T10:00:00.000Z',
  profile: {
    name: 'TestProfil',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  data: {
    habits: [
      {
        // Fehlende Pflichtfelder
        id: 'habit-1'
        // Fehlen: name, status, type, etc.
      }
    ]
  }
};

console.log('🧪 Import/Export Test-Skript');
console.log('================================');

// Schreibe Test-Dateien
fs.writeFileSync('test-valid.json', JSON.stringify(validExportData, null, 2));
fs.writeFileSync('test-invalid-json.json', invalidJson);
fs.writeFileSync('test-incomplete.json', JSON.stringify(incompleteData, null, 2));
fs.writeFileSync('test-wrong-version.json', JSON.stringify(wrongVersion, null, 2));
fs.writeFileSync('test-incompatible.json', JSON.stringify(incompatibleStructure, null, 2));

console.log('✅ Test-Dateien erstellt:');
console.log('   - test-valid.json (Gültig)');
console.log('   - test-invalid-json.json (Ungültiges JSON)');
console.log('   - test-incomplete.json (Unvollständig)');
console.log('   - test-wrong-version.json (Falsche Version)');
console.log('   - test-incompatible.json (Inkompatible Struktur)');
console.log('');
console.log('📋 Test-Anleitung:');
console.log('1. Öffne die App unter http://localhost:5173');
console.log('2. Erstelle ein Profil und füge einige Habits hinzu');
console.log('3. Teste Export: "Daten exportieren" → sollte JSON-Datei herunterladen');
console.log('4. Teste Import mit den Test-Dateien:');
console.log('   - test-valid.json: Sollte erfolgreich importieren');
console.log('   - test-invalid-json.json: Sollte "Ungültiges Dateiformat" melden');
console.log('   - test-incomplete.json: Sollte spezifische Fehler zeigen');
console.log('   - test-wrong-version.json: Sollte "Inkompatible Version" melden');
console.log('   - test-incompatible.json: Sollte Validierungsfehler zeigen');
console.log('5. Teste Datenlöschung: "Alle Daten löschen" → sollte alles entfernen');
console.log('6. Teste Persistenz: Seite neu laden → Daten sollten erhalten bleiben');
console.log('7. Teste Profiltrennung: Versuche Daten in falschem Profil zu importieren');
