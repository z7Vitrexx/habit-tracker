import { useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProfileSelection } from './components/ProfileSelection'
import { AppLayout } from './components/AppLayout'
import { Dashboard } from './components/Dashboard'
import { Habits } from './components/Habits'
import { Statistics } from './components/Statistics'
import { History } from './components/History'
import { Settings } from './components/Settings'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import { OfflineStatus } from './components/OfflineStatus'
import { AuthProvider } from './contexts/AuthContext'
import { ReminderProvider } from './contexts/ReminderContext'
import { useAuth } from './hooks/useAuth'

type ViewType = 'dashboard' | 'habits' | 'stats' | 'history' | 'settings'

function AppContent() {
  const auth = useAuth()
  const { isUnlocked } = auth
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')

  console.log('[App] AppContent rendered, isUnlocked:', isUnlocked)

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
        return <Statistics />
      case 'history':
        return <History />
      case 'settings':
        return <Settings />
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
