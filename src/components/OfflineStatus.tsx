import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Wifi, WifiOff } from 'lucide-react'

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showOfflineMessage) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-600" />
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Online
            </Badge>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-600" />
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Offline
            </Badge>
            <span className="text-sm text-gray-600 ml-2">
              Lokale Daten verfügbar
            </span>
          </>
        )}
      </div>
    </div>
  )
}
