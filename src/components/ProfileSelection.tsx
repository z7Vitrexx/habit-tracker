import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Plus, User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const avatarColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

export function ProfileSelection() {
  const auth = useAuth()
  const { profiles, createProfile, unlockProfile, isLoading, error, clearError } = auth
  const [isCreating, setIsCreating] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [createPassword, setCreatePassword] = useState('')
  const [createPasswordConfirm, setCreatePasswordConfirm] = useState('')
  const [profileName, setProfileName] = useState('')
  const [selectedColor, setSelectedColor] = useState(avatarColors[0])
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showCreatePasswordConfirm, setShowCreatePasswordConfirm] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Auto-unlock demo profile in demo mode
  useEffect(() => {
    if (import.meta.env.VITE_DEMO_MODE === 'true' && profiles.length > 0) {
      const demoProfile = profiles.find(p => p.name === 'Demo')
      if (demoProfile) {
        console.log('Demo mode: Auto-unlocking demo profile')
        unlockProfile(demoProfile, 'demo123')
      }
    }
  }, [profiles, unlockProfile])

  const handleCreateProfile = async () => {
    if (!profileName.trim()) {
      alert('Bitte gib einen Profilnamen ein')
      return
    }

    if (createPassword.length < 6) {
      alert('Das Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    if (createPassword !== createPasswordConfirm) {
      alert('Die Passwörter stimmen nicht überein')
      return
    }

    const success = await createProfile(profileName.trim(), createPassword, selectedColor)
    if (success) {
      // Reset form
      setProfileName('')
      setCreatePassword('')
      setCreatePasswordConfirm('')
      setSelectedColor(avatarColors[0])
      setIsCreating(false)
      setShowCreatePassword(false)
      setShowCreatePasswordConfirm(false)
    }
  }

  const handleUnlock = async () => {
    setLocalError(null)
    clearError()
    
    if (!selectedProfile || !unlockPassword.trim()) {
      setLocalError('Bitte wähle ein Profil und gib dein Passwort ein')
      return
    }

    const profile = profiles.find(p => p.id === selectedProfile)
    if (profile) {
      const success = await unlockProfile(profile, unlockPassword)
      
      if (success) {
        setSelectedProfile(null)
        setUnlockPassword('')
        setShowPassword(false)
        setLocalError(null)
      }
      // Error wird bereits im useAuth Hook gesetzt
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Profile...</p>
        </div>
      </div>
    )
  }

  if (isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center space-y-6 mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Plus className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Neues Profil erstellen</h2>
              <p className="text-muted-foreground text-lg">
                Dein persönlicher Bereich für deine Gewohnheiten
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-8">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateProfile(); }} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-medium mb-3">Profilname</label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="z.B. Max Mustermann"
                      className="text-base h-12"
                      maxLength={30}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Wird nur dir angezeigt
                    </p>
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-3">Farbe auswählen</label>
                    <div className="flex space-x-3">
                      {avatarColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`w-10 h-10 rounded-full border-3 transition-all hover:scale-110 ${
                            selectedColor === color 
                              ? 'border-gray-800 scale-110 shadow-lg' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-3">Passwort</label>
                    <div className="relative">
                      <Input
                        type={showCreatePassword ? 'text' : 'password'}
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder="Mindestens 6 Zeichen"
                        className="pr-12 h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCreatePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      ⚠️ Wichtig: Bei Verlust des Passworts sind alle Daten verloren
                    </p>
                  </div>

                  <div>
                    <label className="block text-base font-medium mb-3">Passwort bestätigen</label>
                    <div className="relative">
                      <Input
                        type={showCreatePasswordConfirm ? 'text' : 'password'}
                        value={createPasswordConfirm}
                        onChange={(e) => setCreatePasswordConfirm(e.target.value)}
                        placeholder="Passwort wiederholen"
                        className="pr-12 h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePasswordConfirm(!showCreatePasswordConfirm)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCreatePasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 py-3 text-base"
                    size="lg"
                    disabled={!profileName.trim() || createPassword.length < 6 || createPassword !== createPasswordConfirm}
                  >
                    Profil erstellen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setProfileName('')
                      setCreatePassword('')
                      setCreatePasswordConfirm('')
                      setSelectedColor(avatarColors[0])
                      clearError()
                    }}
                    className="flex-1 py-3 text-base"
                    size="lg"
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center space-y-6 mb-8">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              Willkommen bei Habit Tracker
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Deine persönlichen Gewohnheiten – sicher und privat verfolgt
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {profiles.length === 0 ? (
          <Card className="text-center shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold">Erstelle dein erstes Profil</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Beginne mit einem persönlichen Profil, um deine Gewohnheiten sicher zu tracken
                  </p>
                </div>
                <Button 
                  onClick={() => setIsCreating(true)} 
                  size="lg"
                  className="px-8 py-3 text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Erstes Profil erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span>Profil auswählen</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Wähle dein Profil aus, um fortzufahren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                {profiles.map(profile => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      setSelectedProfile(profile.id)
                      clearError()
                    }}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all group ${
                      selectedProfile === profile.id
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-12 h-12 rounded-full border-3 border-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: profile.avatarColor }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg">{profile.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Erstellt am {new Date(profile.createdAt).toLocaleDateString('de-DE', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-3 transition-all ${
                        selectedProfile === profile.id
                          ? 'border-primary bg-primary shadow-sm'
                          : 'border-muted group-hover:border-primary/50'
                      }`} />
                    </div>
                  </button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                  className="w-full mt-6 py-3 text-base"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Neues Profil erstellen
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <span>Profil entsperren</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Gib dein Passwort ein, um das Profil zu entsperren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-6">
                <div>
                  <label className="block text-base font-medium mb-3">Passwort</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="Dein sicheres Passwort"
                      className="pr-12 h-12 text-base"
                      disabled={!selectedProfile}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                      disabled={!selectedProfile}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {!selectedProfile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Wähle zuerst ein Profil aus
                    </p>
                  )}
                  {error && selectedProfile && (
                    <p className="text-sm text-destructive mt-2">
                      {error}
                    </p>
                  )}
                  {localError && selectedProfile && (
                    <p className="text-sm text-destructive mt-2">
                      {localError}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleUnlock}
                  className="w-full py-3 text-base"
                  size="lg"
                  disabled={!selectedProfile || !unlockPassword.trim()}
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Profil entsperren
                </Button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground flex items-center justify-center">
                    <Lock className="w-4 h-4 mr-2 text-primary" />
                    Deine Daten sind sicher verschlüsselt
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
