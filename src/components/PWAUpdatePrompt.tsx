import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Download, X, RefreshCw } from 'lucide-react'

export function PWAUpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const handleSWUpdate = () => {
      setShowUpdate(true)
    }

    window.addEventListener('sw-update', handleSWUpdate)

    return () => {
      window.removeEventListener('sw-update', handleSWUpdate)
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
      <Card className="shadow-lg border-green-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Neue Version verfügbar</CardTitle>
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
            Eine neue Version der Habit Tracker App ist verfügbar
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
