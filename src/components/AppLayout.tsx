import type { ReactNode } from 'react'
import { Button } from './ui/button'
import { Lock, Home, BarChart3, Settings, Calendar, Clock, User, Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePWAInstall } from '../hooks/usePWAInstall'

interface AppLayoutProps {
  children: ReactNode
  currentView: 'dashboard' | 'habits' | 'stats' | 'history' | 'settings'
  onViewChange: (view: AppLayoutProps['currentView']) => void
}

export function AppLayout({ children, currentView, onViewChange }: AppLayoutProps) {
  const { currentProfile, lockProfile } = useAuth()
  const { isInstallable, install } = usePWAInstall()

  const navigation = [
    { id: 'dashboard' as const, label: 'Dashboard', shortLabel: 'Home', icon: Home },
    { id: 'habits' as const, label: 'Gewohnheiten', shortLabel: 'Habits', icon: Calendar },
    { id: 'stats' as const, label: 'Statistiken', shortLabel: 'Stats', icon: BarChart3 },
    { id: 'history' as const, label: 'Verlauf', shortLabel: 'Verlauf', icon: Clock },
    { id: 'settings' as const, label: 'Einstellungen', shortLabel: 'Mehr', icon: Settings },
  ]

  const getPageTitle = () => {
    const page = navigation.find(nav => nav.id === currentView)
    return page ? page.label : ''
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">Habit Tracker</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">{getPageTitle()}</p>
                </div>
              </div>
              {currentProfile && (
                <div className="flex items-center space-x-2">
                  {currentProfile.profileImage ? (
                    <img src={currentProfile.profileImage} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: currentProfile.avatarColor }} />
                  )}
                  <span className="hidden sm:block text-sm font-medium text-muted-foreground">{currentProfile.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isInstallable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={install}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 sm:px-3 transition-colors"
                  title="App installieren"
                >
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Installieren</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={lockProfile}
                className="text-muted-foreground hover:text-foreground hover:bg-muted px-2 sm:px-3 transition-colors"
              >
                <Lock className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sperren</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
                  currentView === item.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden safe-area-bottom">
        <div className="grid grid-cols-5">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 min-h-[56px] text-[10px] sm:text-xs transition-colors ${
                currentView === item.id
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-full leading-tight">{item.shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
