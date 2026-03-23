import { createContext, useContext, type ReactNode } from 'react'
import { useReminders } from '../hooks/useReminders'
import type { NotificationPermission } from '../hooks/useReminders'

interface ReminderContextType {
  permission: NotificationPermission
  isSupported: boolean
  requestPermission: () => Promise<NotificationPermission>
  showNotification: (habitName: string, habitIcon?: string) => boolean
  testReminderForHabit: (habitId: string) => boolean
  getLastReminderInfo: (habitId: string) => string | null
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined)

export function ReminderProvider({ children }: { children: ReactNode }) {
  const reminderData = useReminders()
  
  return (
    <ReminderContext.Provider value={reminderData}>
      {children}
    </ReminderContext.Provider>
  )
}

export function useReminderContext() {
  const context = useContext(ReminderContext)
  if (context === undefined) {
    throw new Error('useReminderContext must be used within a ReminderProvider')
  }
  return context
}
