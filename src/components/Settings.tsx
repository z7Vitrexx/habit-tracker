import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Lock, Download, Upload, Trash2, Shield, Cog, AlertTriangle, Bell, Clock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useReminderContext } from '../contexts/ReminderContext'
import { getIcon } from '../lib/iconMapping'
import type { ProfileData } from '../types'
import { ExportDataSchema } from '../types'
import { format, isToday, isTomorrow } from 'date-fns'
import { de } from 'date-fns/locale'
import { usePWAInstall } from '../hooks/usePWAInstall'

export function Settings() {
  const { currentProfile, profileData, saveProfileData, lockProfile } = useAuth()
  const { permission, isSupported, requestPermission, showNotification } = useReminderContext()
  const { isInstallable, isInstalled, isInstalling, install, hasDeferredPrompt } = usePWAInstall()

  console.log('Settings - PWA Install Status:', { isInstallable, isInstalled, isInstalling, hasDeferredPrompt })
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [importError, setImportError] = useState<string>('')
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [testNotificationSent, setTestNotificationSent] = useState(false)
  const [autoLockMinutes, setAutoLockMinutes] = useState(profileData?.settings.autoLockMinutes || 30)
  const weekStart = profileData?.settings.weekStart || 'monday'
  const theme = profileData?.settings.theme || 'system'
  const notifications = profileData?.settings.notifications ?? true

  // Calculate reminder overview
  const reminderOverview = useMemo(() => {
    if (!profileData) return []

    const activeHabits = profileData.habits.filter(habit => 
      habit.status === 'active' && 
      habit.reminderEnabled && 
      habit.reminderTime
    )

    return activeHabits.map(habit => {
      const [hours, minutes] = habit.reminderTime!.split(':').map(Number)
      const today = new Date()
      const reminderDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
      
      // If reminder time has passed today, schedule for tomorrow
      if (reminderDate < today) {
        reminderDate.setDate(reminderDate.getDate() + 1)
      }

      // Format next reminder text
      let nextReminderText = ''
      if (isToday(reminderDate)) {
        nextReminderText = `Heute um ${habit.reminderTime}`
      } else if (isTomorrow(reminderDate)) {
        nextReminderText = `Morgen um ${habit.reminderTime}`
      } else {
        nextReminderText = format(reminderDate, 'EEEE HH:mm', { locale: de })
      }

      // Check frequency
      const frequencyText = (() => {
        switch (habit.frequency.type) {
          case 'daily': return 'Täglich'
          case 'weekdays': return 'Werktags'
          case 'weekends': return 'Wochenenden'
          case 'custom': return `${habit.frequency.weekdays?.length || 0}x pro Woche`
          case 'x_per_week': return `${habit.frequency.xPerWeek || 1}x pro Woche`
          default: return 'Täglich'
        }
      })()

      return {
        habit,
        nextReminderText,
        frequencyText,
        reminderTime: habit.reminderTime!,
        nextReminderDate: reminderDate
      }
    }).sort((a, b) => a.nextReminderDate.getTime() - b.nextReminderDate.getTime())
  }, [profileData])

  const handleExport = async () => {
    if (!profileData || !currentProfile) return

    try {
      setIsExporting(true)
      
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        profile: {
          name: currentProfile.name,
          createdAt: currentProfile.createdAt,
        },
        data: profileData
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `habit-tracker-backup-${currentProfile.name}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export fehlgeschlagen')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsImporting(true)
      setImportError('')
      const text = await file.text()
      const rawData = JSON.parse(text)

      // Strukturierte Validierung mit Zod
      const parseResult = ExportDataSchema.safeParse(rawData)
      
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join('\n')
        throw new Error(`Ungültiges Dateiformat:\n${errorMessages}`)
      }

      const importData = parseResult.data

      // Version-Kompatibilitätsprüfung
      if (importData.version !== '1.0') {
        throw new Error(`Inkompatible Version: ${importData.version}. Erwartet wird Version 1.0`)
      }

      // Profil-Validierung
      if (!importData.profile.name || !importData.profile.createdAt) {
        throw new Error('Ungültige Profilinformationen in der Export-Datei')
      }

      // Sicherheitsabfrage mit Details
      const confirmMessage = `⚠️ Import überschreibt alle aktuellen Daten dieses Profils.

Profil: ${currentProfile?.name}
Exportiert von: ${importData.profile.name}
Exportiert am: ${new Date(importData.exportedAt).toLocaleDateString('de-DE')}

Diese Aktion kann nicht rückgängig gemacht werden.

Möchtest du wirklich fortfahren?`

      if (!confirm(confirmMessage)) {
        return
      }

      const success = await saveProfileData(importData.data)
      if (success) {
        alert('✅ Import erfolgreich! Die Seite wird neu geladen.')
        window.location.reload()
      } else {
        throw new Error('Speichern fehlgeschlagen')
      }
    } catch (error) {
      console.error('Import failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      setImportError(errorMessage)
      alert(`❌ Import fehlgeschlagen:\n${errorMessage}`)
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  const handleDeleteAllData = async () => {
    if (!currentProfile || !profileData) return

    try {
      setIsDeleting(true)
      
      // Leere Profildaten erstellen
      const emptyProfileData: ProfileData = {
        habits: [],
        checkIns: [],
        categories: [],
        settings: {
          weekStart: 'monday',
          theme: 'system',
          autoLockMinutes: 30,
          notifications: true,
        },
        reminders: [],
      }

      const success = await saveProfileData(emptyProfileData)
      if (success) {
        alert('✅ Alle Daten wurden erfolgreich gelöscht! Die Seite wird neu geladen.')
        window.location.reload()
      } else {
        throw new Error('Löschen fehlgeschlagen')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('❌ Löschen fehlgeschlagen: ' + (error as Error).message)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleTestNotification = async () => {
    if (!isSupported) {
      alert('Dein Browser unterstützt keine Benachrichtigungen.')
      return
    }

    if (permission === 'denied') {
      alert('Benachrichtigungen wurden in deinem Browser blockiert. Ändere die Einstellungen in deinem Browser, um Benachrichtigungen zu aktivieren.')
      return
    }

    if (permission === 'default') {
      setIsRequestingPermission(true)
      try {
        const result = await requestPermission()
        if (result === 'granted') {
          const success = showNotification('Habit Tracker', 'Dies ist eine Testbenachrichtigung!')
          if (success) {
            setTestNotificationSent(true)
            setTimeout(() => setTestNotificationSent(false), 3000)
          }
        }
      } catch (error) {
        alert('Fehler beim Anfordern der Berechtigung: ' + (error as Error).message)
      } finally {
        setIsRequestingPermission(false)
      }
    }

    if (permission === 'granted') {
      const success = showNotification('Habit Tracker', 'Dies ist eine Testbenachrichtigung!')
      if (success) {
        setTestNotificationSent(true)
        setTimeout(() => setTestNotificationSent(false), 3000)
      }
    }
  }

  const handleSettingsUpdate = async (updates: Partial<ProfileData['settings']>) => {
    if (!profileData) return
    
    const updatedProfileData = {
      ...profileData,
      settings: {
        ...profileData.settings,
        ...updates,
      },
    }

    await saveProfileData(updatedProfileData)
  }

  if (!currentProfile || !profileData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Bitte entsperre zuerst ein Profil</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Datenverwaltung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Datenverwaltung</span>
          </CardTitle>
          <CardDescription>
            Exportiere, importiere und verwalte deine profilspezifischen Daten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Daten exportieren</h3>
                  <p className="text-sm text-muted-foreground">
                    Exportiere alle Daten dieses Profils als JSON-Datei
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exportiere...' : 'Exportieren'}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Daten importieren</h3>
                <p className="text-sm text-muted-foreground">
                  Importiere eine zuvor exportierte JSON-Datei
                </p>
                {importError && (
                  <p className="text-sm text-red-600 mt-1">{importError}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                  id="import-file"
                />
                <Button
                  onClick={() => document.getElementById('import-file')?.click()}
                  disabled={isImporting}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isImporting ? 'Importiere...' : 'Importieren'}</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
              <div>
                <h3 className="font-medium text-red-600">Alle Daten löschen</h3>
                <p className="text-sm text-muted-foreground">
                  Lösche alle Gewohnheiten, Check-ins und Einstellungen dieses Profils
                </p>
              </div>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Lösche...' : 'Löschen'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allgemeine Einstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cog className="w-5 h-5" />
            <span>Allgemeine Einstellungen</span>
          </CardTitle>
          <CardDescription>
            Passe die Anwendung an deine Bedürfnisse an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Automatische Sperre</h3>
                <p className="text-sm text-muted-foreground">
                  Nach wie vielen Minuten das Profil automatisch gesperrt wird
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">Minuten</span>
                <Button
                  onClick={() => handleSettingsUpdate({ autoLockMinutes })}
                  variant="outline"
                  size="sm"
                >
                  Speichern
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Wochenbeginn</h3>
                <p className="text-sm text-muted-foreground">
                  Wann die Woche in der Kalenderansicht beginnt
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={weekStart}
                  onChange={(e) => handleSettingsUpdate({ weekStart: e.target.value as 'monday' | 'sunday' })}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="monday">Montag</option>
                  <option value="sunday">Sonntag</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Design</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle das Farbschema der Anwendung
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={theme}
                  onChange={(e) => handleSettingsUpdate({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="light">Hell</option>
                  <option value="dark">Dunkel</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Benachrichtigungen</h3>
                <p className="text-sm text-muted-foreground">
                  Erinnerungen und Benachrichtigungen aktivieren
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {!isSupported && (
                  <span className="text-sm text-orange-600">Nicht unterstützt</span>
                )}
                {isSupported && permission === 'denied' && (
                  <span className="text-sm text-red-600">Blockiert</span>
                )}
                {isSupported && permission === 'default' && (
                  <span className="text-sm text-yellow-600">Nicht angefragt</span>
                )}
                {isSupported && permission === 'granted' && (
                  <span className="text-sm text-green-600">Erlaubt</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Globale Benachrichtigungen</h4>
                  <p className="text-xs text-muted-foreground">
                    Aktiviert die Benachrichtigungsfunktion für alle Habits
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={notifications && isSupported && permission === 'granted'}
                    onChange={(e) => handleSettingsUpdate({ notifications: e.target.checked })}
                    disabled={!isSupported || permission !== 'granted'}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Testfunktion</h4>
                  <p className="text-xs text-muted-foreground">
                    Sendet eine Testbenachrichtigung zur Überprüfung
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestNotification}
                    disabled={!isSupported || isRequestingPermission}
                    className="flex items-center space-x-1"
                  >
                    <Bell className="w-3 h-3" />
                    <span>
                      {isRequestingPermission ? 'Wird angefragt...' : 'Testbenachrichtigung'}
                    </span>
                  </Button>
                </div>
              </div>

              {testNotificationSent && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Testbenachrichtigung wurde gesendet!
                  </p>
                </div>
              )}

              {!isSupported && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    Dein Browser unterstützt keine Benachrichtigungen. 
                    Verwende einen modernen Browser für Erinnerungen.
                  </p>
                </div>
              )}

              {isSupported && permission === 'denied' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    Benachrichtigungen wurden in deinem Browser blockiert. 
                    Ändere die Einstellungen in deinem Browser, um Erinnerungen zu aktivieren.
                  </p>
                </div>
              )}

              {isSupported && permission === 'default' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Benachrichtigungen wurden noch nicht angefragt. 
                    Klicke auf "Testbenachrichtigung", um die Berechtigung anzufordern.
                  </p>
                </div>
              )}

              {isSupported && permission === 'granted' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Benachrichtigungen sind aktiviert. 
                    Du kannst jetzt Testbenachrichtigungen senden und Erinnerungen für Habits einrichten.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erinnerungen-Übersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Aktive Erinnerungen</span>
          </CardTitle>
          <CardDescription>
            Übersicht aller eingerichteten Habit-Erinnerungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminderOverview.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Keine aktiven Erinnerungen</h3>
              <p className="text-muted-foreground">
                Du hast noch keine Erinnerungen für deine Gewohnheiten eingerichtet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminderOverview.map(({ habit, nextReminderText, frequencyText, reminderTime }) => {
                const IconComponent = getIcon(habit.icon)
                return (
                  <div key={habit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: habit.color }}
                      >
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{habit.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{reminderTime}</span>
                          <span>•</span>
                          <span>{frequencyText}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">{nextReminderText}</div>
                      <div className="text-xs text-muted-foreground">Nächste Erinnerung</div>
                    </div>
                  </div>
                )
              })}
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Wichtiger Hinweis:</strong> Erinnerungen funktionieren nur, wenn die App im Browser geöffnet ist. 
                  Die Benachrichtigungen sind zuverlässig, solange die App aktiv ist.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PWA Installation */}
      {isInstallable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>App installieren</span>
            </CardTitle>
            <CardDescription>
              Installiere Habit Tracker Pro auf deinem Gerät für schnelleren Zugriff und Offline-Nutzung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Vorteile der Installation:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Schneller Start von deinem Startbildschirm</li>
                  <li>• Vollständige Offline-Funktionalität</li>
                  <li>• Keine Browser-Leiste für mehr Platz</li>
                  <li>• Bessere Integration mit dem Betriebssystem</li>
                </ul>
              </div>
              <Button 
                onClick={install} 
                disabled={isInstalling}
                className="w-full"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Wird installiert...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    App installieren
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PWA nicht installierbar Fallback */}
      {!isInstalled && !hasDeferredPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>App Installation</span>
            </CardTitle>
            <CardDescription>
              Informationen zur Installation der App
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Hinweis:</strong> Die Installation wird von deinem Browser aktuell nicht direkt angeboten.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Mögliche Lösungen:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Seite in Chrome/Edge öffnen und neu laden</li>
                  <li>• Nicht im Inkognito-Modus surfen</li>
                  <li>• Browser-Cache leeren und neu versuchen</li>
                  <li>• Über das Browser-Menü "App installieren" prüfen</li>
                  <li>• Seite als Lesezeichen und "Zum Startbildschirm hinzufügen"</li>
                </ul>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tipp:</strong> In Chrome/Edge sollte das Install-Symbol in der Adressleiste erscheinen (⬇️).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isInstalled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>App installiert</span>
            </CardTitle>
            <CardDescription>
              Habit Tracker Pro ist bereits auf deinem Gerät installiert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                ✅ Die App ist erfolgreich installiert und kann offline verwendet werden.
              </p>
              <p className="text-sm text-muted-foreground">
                Du kannst die App über dein Startbildschirm oder App-Menü starten.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Über diese App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cog className="w-5 h-5" />
            <span>Über diese App</span>
          </CardTitle>
          <CardDescription>
            Informationen und technische Details zu Habit Tracker Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span className="text-lg">🔒</span>
                <span>Datenschutz & Sicherheit</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>100% lokal:</strong> Deine Daten verlassen niemals dein Gerät</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Verschlüsselt:</strong> Militärischer AES-256 Passwortschutz</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Kein Cloud-Sync:</strong> Alles läuft nur in deinem Browser</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Keine Tracker:</strong> Die App sammelt keine Nutzerdaten</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span className="text-lg">🔔</span>
                <span>Erinnerungen - Technische Grenzen</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Nur im aktiven Browser:</strong> Funktioniert nur wenn Browser läuft</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Keine systemweiten Erinnerungen:</strong> Wie native Apps</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Browser-spezifisch:</strong> Gebunden an deinen Browser</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Keine Garantie:</strong> Betriebssystem kann blockieren</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span className="text-lg">📤</span>
                <span>Daten-Sicherung</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Regelmäßig exportieren:</strong> Sichere deine Fortschritte</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Gerätewechsel:</strong> Manuellexport/import notwendig</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>JSON-Format:</strong> Menschlich lesbares Backup</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Version 1.0:</strong> Kompatibel für zukünftige Updates</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center space-x-2">
                <span className="text-lg">🛠️</span>
                <span>Technologie</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>React 19 + TypeScript:</strong> Moderne Web-Technologie</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>PWA:</strong> Installierbar wie eine native App</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>IndexedDB:</strong> Lokale Datenspeicherung</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Web Crypto API:</strong> Sichere clientseitige Verschlüsselung</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-center">
                  <strong>Habit Tracker Pro v1.0</strong>
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Eine private, sichere und funktionale Habit-Tracking App ohne Kompromisse beim Datenschutz.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profil-Aktionen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Profil-Aktionen</span>
          </CardTitle>
          <CardDescription>
          Verwalte den Zugriff auf dein Profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Profil sperren</h3>
              <p className="text-sm text-muted-foreground">
                Sperre den Zugriff auf dieses Profil
              </p>
            </div>
            <Button
              onClick={lockProfile}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Sperren</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Alle Daten löschen?</span>
            </DialogTitle>
            <DialogDescription>
              Diese Aktion löscht alle Gewohnheiten, Check-ins und Einstellungen dieses Profils unwiderruflich.
              Dies kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                Profil: {currentProfile.name}
              </p>
              <p className="text-sm text-red-600 mt-1">
                • Alle Gewohnheiten werden gelöscht<br/>
                • Alle Check-ins werden gelöscht<br/>
                • Alle Einstellungen werden zurückgesetzt<br/>
                • Diese Aktion kann nicht rückgängig gemacht werden
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                variant="destructive"
                className="flex-1"
              >
                {isDeleting ? 'Lösche...' : 'Ja, alle Daten löschen'}
              </Button>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings
