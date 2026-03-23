import { useState, useEffect, Suspense, lazy } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProfileSelection } from './components/ProfileSelection'
import { AppLayout } from './components/AppLayout'
import { Dashboard } from './components/Dashboard'
import { Habits } from './components/Habits'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import { OfflineStatus } from './components/OfflineStatus'
import { AuthProvider } from './contexts/AuthContext'
import { ReminderProvider } from './contexts/ReminderContext'
import { useAuth } from './hooks/useAuth'
import { seedDemoData } from './lib/demoSeed'

// Lazy load heavy components with error handling
const Statistics = lazy(() => 
  import('./components/Statistics').catch(() => {
    // Fallback to a simple error component
    return import('./components/StatisticsError')
  })
)
const History = lazy(() => 
  import('./components/History').catch(() => {
    return import('./components/HistoryError')
  })
)
const Settings = lazy(() => 
  import('./components/Settings').catch(() => {
    return import('./components/SettingsError')
  })
)

type ViewType = 'dashboard' | 'habits' | 'stats' | 'history' | 'settings'

function AppContent() {
  const auth = useAuth()
  const { isUnlocked } = auth
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  // Listen for navigation events from child components (e.g. WelcomeScreen)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const detail = (e as CustomEvent).detail as ViewType
      if (detail) setCurrentView(detail)
    }
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  if (!isUnlocked) {
    return <ProfileSelection />
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'habits':
        return <Habits />
      case 'stats':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Lade Statistiken...</div>
            </div>
          }>
            <Statistics />
          </Suspense>
        )
      case 'history':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Lade Verlauf...</div>
            </div>
          }>
            <History />
          </Suspense>
        )
      case 'settings':
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Lade Einstellungen...</div>
            </div>
          }>
            <Settings />
          </Suspense>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <OfflineStatus />
    </AppLayout>
  )
}

function App() {
  // Seed demo data on app startup if needed
  useEffect(() => {
    console.log('App mounted - checking demo seed conditions')
    seedDemoData()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ReminderProvider>
          <AppContent />
        </ReminderProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
