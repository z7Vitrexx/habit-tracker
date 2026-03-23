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

  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFileData, setImportFileData] = useState<{ data: any; profileName: string; exportDate: string } | null>(null)
  const [importError, setImportError] = useState<string>('')
  const [importSuccess, setImportSuccess] = useState(false)
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
      setExportSuccess(false)
      
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

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 6000)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Der Export konnte nicht erstellt werden. Bitte versuche es erneut.')
    } finally {
      setIsExporting(false)
    }
  }

  // Step 1: Validate file and show confirmation dialog
  const handleImportFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImportError('')
      setImportSuccess(false)
      const text = await file.text()
      const rawData = JSON.parse(text)

      // Strukturierte Validierung mit Zod
      const parseResult = ExportDataSchema.safeParse(rawData)
      
      if (!parseResult.success) {
        throw new Error('Die ausgewählte Datei ist keine gültige Backup-Datei. Bitte wähle eine Datei, die zuvor mit dieser App exportiert wurde.')
      }

      const importData = parseResult.data

      // Version-Kompatibilitätsprüfung
      if (importData.version !== '1.0') {
        throw new Error('Diese Backup-Datei stammt aus einer anderen Version und ist nicht kompatibel.')
      }

      // Profil-Validierung
      if (!importData.profile.name || !importData.profile.createdAt) {
        throw new Error('Die Backup-Datei enthält keine gültigen Profilinformationen.')
      }

      // File is valid – store data and show confirmation dialog
      setImportFileData({
        data: importData,
        profileName: importData.profile.name,
        exportDate: new Date(importData.exportedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      })
      setImportDialogOpen(true)
    } catch (error) {
      console.error('Import validation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Die Datei konnte nicht gelesen werden.'
      setImportError(errorMessage)
    } finally {
      event.target.value = ''
    }
  }

  // Step 2: User confirmed import – apply data
  const handleImportConfirm = async () => {
    if (!importFileData) return

    try {
      setIsImporting(true)
      const success = await saveProfileData(importFileData.data.data)
      if (success) {
        setImportSuccess(true)
        setImportDialogOpen(false)
        setImportFileData(null)
        // Short delay so user sees the success message
        setTimeout(() => window.location.reload(), 1500)
      } else {
        throw new Error('Speichern fehlgeschlagen')
      }
    } catch (error) {
      console.error('Import failed:', error)
      setImportError('Der Import konnte nicht gespeichert werden. Bitte versuche es erneut.')
      setImportDialogOpen(false)
      setImportFileData(null)
    } finally {
      setIsImporting(false)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Passe die App an deine Bedürfnisse an</p>
      </div>

      {/* Lokale Speicherung Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">Deine Daten bleiben auf diesem Gerät</h3>
              <p className="text-sm text-muted-foreground">
                Alle Gewohnheiten, Check-ins und Einstellungen werden ausschließlich lokal in deinem Browser gespeichert. 
                Es gibt keinen Cloud-Sync – deine Daten verlassen niemals dein Gerät.
              </p>
              <p className="text-sm text-muted-foreground">
                Damit du bei einem Gerätewechsel oder Browser-Reset nichts verlierst, empfehlen wir dir, regelmäßig ein Backup zu erstellen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup erstellen (Export) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Backup erstellen</span>
          </CardTitle>
          <CardDescription>
            Sichere alle Daten dieses Profils als Datei auf deinem Gerät
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Das Backup enthält:</p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li>Alle Gewohnheiten und deren Einstellungen</li>
              <li>Alle bisherigen Check-ins und Notizen</li>
              <li>Deine App-Einstellungen und Erinnerungen</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full sm:w-auto flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Wird erstellt...' : 'Backup herunterladen'}</span>
            </Button>
          </div>
          {exportSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                Backup wurde erfolgreich erstellt und heruntergeladen.
              </p>
              <p className="text-xs text-green-700 mt-1">
                Bewahre die Datei sicher auf, z.B. in einem Cloud-Ordner oder auf einem USB-Stick.
              </p>
            </div>
          )}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tipp:</strong> Erstelle regelmäßig ein Backup – z.B. einmal pro Woche. So bist du auf der sicheren Seite.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup wiederherstellen (Import) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Backup wiederherstellen</span>
          </CardTitle>
          <CardDescription>
            Stelle ein zuvor erstelltes Backup wieder her
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Wichtig:</strong> Beim Wiederherstellen werden alle aktuellen Daten dieses Profils durch die Daten aus der Backup-Datei ersetzt. 
              Erstelle vorher ein Backup, wenn du deine aktuellen Daten behalten möchtest.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Es werden nur gültige Backup-Dateien akzeptiert, die mit dieser App erstellt wurden.
          </div>
          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{importError}</p>
            </div>
          )}
          {importSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                Backup wurde erfolgreich wiederhergestellt. Die Seite wird neu geladen…
              </p>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImportFileSelect}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <Button
              onClick={() => { setImportError(''); document.getElementById('import-file')?.click() }}
              disabled={isImporting}
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Wird wiederhergestellt...' : 'Backup-Datei auswählen'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daten löschen */}
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            <span>Profildaten löschen</span>
          </CardTitle>
          <CardDescription>
            Lösche alle Daten dieses Profils unwiderruflich
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Damit werden alle Gewohnheiten, Check-ins, Einstellungen und Erinnerungen dieses Profils endgültig gelöscht. 
            Dein Profil selbst bleibt erhalten, ist danach aber leer.
          </p>
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Empfehlung:</strong> Erstelle vorher ein Backup, falls du deine Daten später noch brauchst.
            </p>
          </div>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Alle Profildaten löschen…</span>
          </Button>
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
            <div className="space-y-2">
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
                <span className="text-sm text-muted-foreground">Min.</span>
                <Button
                  onClick={() => handleSettingsUpdate({ autoLockMinutes })}
                  variant="outline"
                  size="sm"
                >
                  Speichern
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="font-medium">Wochenbeginn</h3>
                <p className="text-sm text-muted-foreground">
                  Wann die Woche in der Kalenderansicht beginnt
                </p>
              </div>
              <select
                value={weekStart}
                onChange={(e) => handleSettingsUpdate({ weekStart: e.target.value as 'monday' | 'sunday' })}
                className="w-full sm:w-auto px-3 py-2 border rounded text-sm bg-background"
              >
                <option value="monday">Montag</option>
                <option value="sunday">Sonntag</option>
              </select>
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
                Du kannst Erinnerungen beim Erstellen oder Bearbeiten eines Habits unter „Gewohnheiten" aktivieren.
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
            <Shield className="w-5 h-5" />
            <span>Über diese App</span>
          </CardTitle>
          <CardDescription>
            Datenschutz, Sicherheit und technische Hinweise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Datenschutz & Sicherheit</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
                <li>• <strong>Lokal gespeichert:</strong> Alle Daten bleiben auf deinem Gerät</li>
                <li>• <strong>Verschlüsselt:</strong> Profildaten sind mit AES-256 geschützt</li>
                <li>• <strong>Kein Cloud-Sync:</strong> Keine Daten werden an Server gesendet</li>
                <li>• <strong>Kein Tracking:</strong> Die App sammelt keine Nutzungsdaten</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Erinnerungen – Hinweise</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
                <li>• Erinnerungen funktionieren nur, solange die App im Browser geöffnet ist</li>
                <li>• Keine systemweiten Push-Benachrichtigungen wie bei nativen Apps</li>
                <li>• Die Zuverlässigkeit hängt von Browser und Betriebssystem ab</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Backup & Gerätewechsel</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-4">
                <li>• Erstelle regelmäßig ein Backup über „Backup erstellen" weiter oben</li>
                <li>• Für einen Gerätewechsel: exportiere auf dem alten Gerät, importiere auf dem neuen</li>
                <li>• Backups sind als JSON-Datei gespeichert und mit zukünftigen Versionen kompatibel</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium text-center">
                  Habit Tracker Pro v1.1
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Privat, sicher und funktional – ohne Kompromisse beim Datenschutz.
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

      {/* Import Confirmation Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { if (!open) { setImportDialogOpen(false); setImportFileData(null) } }}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Backup wiederherstellen?</span>
            </DialogTitle>
            <DialogDescription>
              Beim Wiederherstellen werden alle aktuellen Daten dieses Profils ersetzt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {importFileData && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <p className="text-sm text-amber-900">
                  <strong>Aktuelles Profil:</strong> {currentProfile.name}
                </p>
                <p className="text-sm text-amber-800">
                  <strong>Backup von:</strong> {importFileData.profileName}
                </p>
                <p className="text-sm text-amber-800">
                  <strong>Erstellt am:</strong> {importFileData.exportDate}
                </p>
              </div>
            )}
            <div className="p-3 bg-muted/50 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Alle deine aktuellen Gewohnheiten, Check-ins und Einstellungen werden durch die Daten aus dem Backup ersetzt. 
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => { setImportDialogOpen(false); setImportFileData(null) }}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleImportConfirm}
                disabled={isImporting}
                className="flex-1"
              >
                {isImporting ? 'Wird wiederhergestellt...' : 'Ja, Backup wiederherstellen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Wirklich alle Daten löschen?</span>
            </DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">
                Profil „{currentProfile.name}" – folgende Daten werden gelöscht:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Alle Gewohnheiten und deren Einstellungen</li>
                <li>• Alle bisherigen Check-ins und Notizen</li>
                <li>• Alle Erinnerungen</li>
                <li>• Alle App-Einstellungen dieses Profils</li>
              </ul>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Tipp:</strong> Erstelle zuerst ein Backup, wenn du deine Daten eventuell noch brauchst.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                variant="destructive"
                className="flex-1"
              >
                {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings
