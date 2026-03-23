import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, X, RefreshCw, AlertTriangle } from 'lucide-react'

export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleSWUpdate = () => {
      setShowUpdate(true)
      setErrorMessage('')
    }

    // Handle dynamic import errors
    const handleDynamicImportError = (event: Event) => {
      const error = event as ErrorEvent
      if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
        console.error('[PWA] Dynamic import error detected:', error.message)
        setShowUpdate(true)
        setErrorMessage('Einige Seiten konnten nicht geladen werden. Bitte aktualisiere die App.')
      }
    }

    // Handle unhandled promise rejections (dynamic import failures)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes('dynamically imported')) {
        console.error('[PWA] Dynamic import rejection:', event.reason)
        setShowUpdate(true)
        setErrorMessage('Einige Seiten konnten nicht geladen werden. Bitte aktualisiere die App.')
      }
    }

    window.addEventListener('sw-update', handleSWUpdate)
    window.addEventListener('error', handleDynamicImportError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('sw-update', handleSWUpdate)
      window.removeEventListener('error', handleDynamicImportError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    
    // Tell the service worker to skip waiting
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    }
    
    // Reload the page
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className={`shadow-lg ${errorMessage ? 'border-yellow-200' : 'border-green-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {errorMessage && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
              {errorMessage ? 'Update erforderlich' : 'Neue Version verfügbar'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {errorMessage || 'Eine neue Version der Habit Tracker App ist verfügbar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Aktualisiere...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Jetzt aktualisieren
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
