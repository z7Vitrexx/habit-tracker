import { createContext, useContext, type ReactNode, useState, useEffect } from 'react'
import { db } from '../db'
import type { ProfileMetadata, ProfileData } from '../types'
import { encryptProfileData, decryptProfileData, verifyPassword } from '../lib/crypto'

interface AuthContextType {
  profiles: ProfileMetadata[]
  currentProfile: ProfileMetadata | null
  isUnlocked: boolean
  profileData: ProfileData | null
  isLoading: boolean
  error: string | null
  createProfile: (name: string, password: string, avatarColor: string) => Promise<boolean>
  unlockProfile: (profile: ProfileMetadata, password: string) => Promise<boolean>
  lockProfile: () => void
  deleteProfile: (profileId: string) => Promise<boolean>
  saveProfileData: (data: ProfileData) => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ProfileMetadata[]>([])
  const [currentProfile, setCurrentProfile] = useState<ProfileMetadata | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState<string | null>(null)
  const [autoLockTimer, setAutoLockTimer] = useState<number | null>(null)

  // Auto-lock effect
  useEffect(() => {
    if (isUnlocked && profileData?.settings.autoLockMinutes) {
      // Clear existing timer
      if (autoLockTimer) {
        clearTimeout(autoLockTimer)
      }

      // Set new timer
      const timer = window.setTimeout(() => {
        console.log('[Auth] Auto-lock triggered after', profileData.settings.autoLockMinutes, 'minutes')
        lockProfile()
      }, profileData.settings.autoLockMinutes * 60 * 1000)

      setAutoLockTimer(timer)
    }

    return () => {
      if (autoLockTimer) {
        clearTimeout(autoLockTimer)
      }
    }
  }, [isUnlocked, profileData?.settings.autoLockMinutes])

  // Reset timer on user activity
  useEffect(() => {
    const resetAutoLockTimer = () => {
      if (isUnlocked && profileData?.settings.autoLockMinutes) {
        if (autoLockTimer) {
          clearTimeout(autoLockTimer)
        }
        
        const timer = window.setTimeout(() => {
          console.log('[Auth] Auto-lock triggered after activity timeout')
          lockProfile()
        }, profileData.settings.autoLockMinutes * 60 * 1000)

        setAutoLockTimer(timer)
      }
    }

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, resetAutoLockTimer)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetAutoLockTimer)
      })
      if (autoLockTimer) {
        clearTimeout(autoLockTimer)
      }
    }
  }, [isUnlocked, profileData?.settings.autoLockMinutes, autoLockTimer])

  // Load profiles on mount
  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const allProfiles = await db.profiles.orderBy('createdAt').toArray()
      setProfiles(allProfiles)
    } catch {
      setError('Fehler beim Laden der Profile')
    } finally {
      setIsLoading(false)
    }
  }

  const createProfile = async (
    name: string,
    password: string,
    avatarColor: string
  ): Promise<boolean> => {
    try {
      setError(null)
      
      const initialData: ProfileData = {
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

      // Encrypt the profile data
      const { encryptedData, salt, iv } = await encryptProfileData(initialData, password)

      // Create profile metadata
      const profile: ProfileMetadata = {
        id: crypto.randomUUID(),
        name,
        avatarColor,
        encryptedData,
        salt,
        iv,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save to database
      await db.profiles.add(profile)
      await loadProfiles()
      
      return true
    } catch {
      setError('Fehler beim Erstellen des Profils')
      return false
    }
  }

  const unlockProfile = async (profile: ProfileMetadata, password: string): Promise<boolean> => {
    try {
      setError(null)
      
      const isValid = await verifyPassword(
        profile.encryptedData,
        password,
        profile.salt,
        profile.iv
      )

      if (!isValid) {
        setError('Falsches Passwort')
        return false
      }

      // Decrypt profile data
      const data = await decryptProfileData(
        profile.encryptedData,
        password,
        profile.salt,
        profile.iv
      )

      setCurrentProfile(profile)
      setProfileData(data)
      setIsUnlocked(true)
      setCurrentPassword(password)
      
      return true
    } catch {
      setError('Fehler beim Entsperren des Profils')
      return false
    }
  }

  const lockProfile = () => {
    setCurrentProfile(null)
    setProfileData(null)
    setIsUnlocked(false)
    setCurrentPassword(null)
    setError(null)
  }

  const deleteProfile = async (profileId: string): Promise<boolean> => {
    try {
      setError(null)
      
      // Lock profile if it's the current one
      if (currentProfile?.id === profileId) {
        lockProfile()
      }

      await db.profiles.delete(profileId)
      await loadProfiles()
      
      return true
    } catch {
      setError('Fehler beim Löschen des Profils')
      return false
    }
  }

  const saveProfileData = async (data: ProfileData): Promise<boolean> => {
    if (!currentProfile || !currentPassword) {
      return false
    }

    try {
      setError(null)
      
      // Encrypt updated data
      const { encryptedData, salt, iv } = await encryptProfileData(data, currentPassword)

      // Update profile metadata
      const updatedProfile: ProfileMetadata = {
        ...currentProfile,
        encryptedData,
        salt,
        iv,
        updatedAt: new Date().toISOString(),
      }

      await db.profiles.update(currentProfile.id, updatedProfile)
      
      // Update local state
      setCurrentProfile(updatedProfile)
      setProfileData(data)
      
      return true
    } catch {
      setError('Fehler beim Speichern der Profildaten')
      return false
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        profiles,
        currentProfile,
        isUnlocked,
        profileData,
        isLoading,
        error,
        createProfile,
        unlockProfile,
        lockProfile,
        deleteProfile,
        saveProfileData,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
