import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const isInstallable = !isInstalled && !!deferredPrompt

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('[PWA] beforeinstallprompt received')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      console.log('[PWA] App installed')
      setIsInstalled(true)
      setDeferredPrompt(null)
      setIsInstalling(false)
    }

    // Prüfe ob App bereits installiert ist
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true
    if (isStandalone) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false
    if (isInstalling) return false

    setIsInstalling(true)

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('[PWA] Install outcome:', outcome)

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setDeferredPrompt(null)
        return true
      } else {
        setIsInstalling(false)
        return false
      }
    } catch (error) {
      console.error('[PWA] Install error:', error)
      setIsInstalling(false)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    isInstalling,
    install,
    hasDeferredPrompt: !!deferredPrompt
  }
}
