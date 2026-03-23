import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import type { Habit } from '../types'

export type NotificationPermission = 'granted' | 'denied' | 'default'

// Store for tracking last reminder triggers per habit
const lastReminderTriggers = new Map<string, string>() // habitId -> dateKey

export function useReminders() {
  const { profileData } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  // Check if notifications are supported and load persisted permission
  useEffect(() => {
    const isNotificationSupported = 'Notification' in window
    setIsSupported(isNotificationSupported)
    
    if (isNotificationSupported) {
      const currentPermission = Notification.permission as NotificationPermission
      setPermission(currentPermission)
      
      // Load saved permission from localStorage if available
      const savedPermission = localStorage.getItem('notificationPermission') as NotificationPermission
      if (savedPermission && savedPermission !== currentPermission) {
        // Permission might have changed in browser settings
        console.log('[Reminder] Permission mismatch: browser=', currentPermission, 'saved=', savedPermission)
      }
    }
  }, [])

  // Save permission to localStorage when it changes
  useEffect(() => {
    if (isSupported && permission !== 'default') {
      localStorage.setItem('notificationPermission', permission)
    }
  }, [permission, isSupported])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission()
      setPermission(result as NotificationPermission)
      return result as NotificationPermission
    }

    return Notification.permission as NotificationPermission
  }, [isSupported])

  // Check if habit should be reminded today based on frequency
  const shouldRemindToday = useCallback((habit: Habit): boolean => {
    const today = new Date()
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay() // Convert Sunday=0 to 7

    switch (habit.frequency.type) {
      case 'daily':
        return true
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5
      case 'weekends':
        return dayOfWeek === 6 || dayOfWeek === 7
      case 'custom':
        return habit.frequency.weekdays?.includes(dayOfWeek) || false
      case 'x_per_week':
        // For x_per_week, we'll check if we haven't reached the target yet this week
        // This is a simplified check - in production, you'd want more sophisticated logic
        return true
      default:
        return false
    }
  }, [])

  // Show notification for habit
  const showNotification = useCallback((habitName: string, habitIcon?: string) => {
    if (!isSupported || permission !== 'granted') {
      return false
    }

    try {
      const notification = new Notification(`Habit Tracker - Erinnerung`, {
        body: `Vergiss nicht: ${habitName}`,
        icon: habitIcon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `habit-${habitName}`,
        requireInteraction: false,
        silent: false
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return true
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }, [isSupported, permission])

  // Test reminder for specific habit (for testing purposes)
  const testReminderForHabit = useCallback((habitId: string) => {
    if (!profileData || permission !== 'granted') {
      console.log(`[Reminder] Test failed - no profileData or permission not granted. Permission: ${permission}`)
      return false
    }

    const habit = profileData.habits.find(h => h.id === habitId)
    console.log(`[Reminder] Test button clicked - habitId: ${habitId}, found habit:`, habit?.name, 'reminderEnabled:', habit?.reminderEnabled)
    
    if (!habit) {
      console.log(`[Reminder] Test failed - habit not found for ID: ${habitId}`)
      return false
    }

    // For testing, we allow testing even if reminder is not enabled
    console.log(`[Reminder] Testing notification for ${habit.name}`)
    const success = showNotification(habit.name, habit.icon)
    
    if (success) {
      console.log(`[Reminder] Test notification successful for ${habit.name}`)
    } else {
      console.log(`[Reminder] Test notification failed for ${habit.name}`)
    }
    
    return success
  }, [profileData, permission, showNotification])

  // Test reminder in 1 minute (for testing purposes)
  const testReminderInOneMinute = useCallback((habitId: string) => {
    if (!profileData || permission !== 'granted') {
      return false
    }

    const habit = profileData.habits.find(h => h.id === habitId)
    if (!habit || !habit.reminderEnabled) {
      return false
    }

    // Show notification immediately for testing
    console.log(`[Reminder] Testing reminder for ${habit.name}`)
    const success = showNotification(habit.name, habit.icon)
    
    if (success) {
      // Record that we reminded today for testing
      const today = new Date().toISOString().split('T')[0]
      lastReminderTriggers.set(habitId, today)
      console.log(`[Reminder] Test reminder recorded for ${habit.name}`)
    }
    
    return success
  }, [profileData, permission, showNotification])

  // Get last reminder trigger info for UI
  const getLastReminderInfo = useCallback((habitId: string): string | null => {
    const lastTrigger = lastReminderTriggers.get(habitId)
    return lastTrigger || null
  }, [])

  // Check and trigger reminders (should be called periodically)
  const checkReminders = useCallback(() => {
    if (!profileData || permission !== 'granted') {
      console.log(`[Reminder] Check skipped - no profileData or permission not granted. Permission: ${permission}`)
      return
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const today = now.toISOString().split('T')[0]
    
    // Debug logging
    console.log(`[Reminder] Checking reminders at ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`)
    console.log(`[Reminder] Found ${profileData.habits.length} habits to check`)

    // Get today's check-ins to avoid duplicate notifications
    const todayCheckIns = profileData.checkIns.filter(ci => ci.date === today)

    profileData.habits.forEach((habit, index) => {
      console.log(`[Reminder] Checking habit ${index + 1}: ${habit.name}, status: ${habit.status}, reminderEnabled: ${habit.reminderEnabled}, reminderTime: ${habit.reminderTime}`)
      
      // Only check active habits with enabled reminders
      if (habit.status !== 'active' || !habit.reminderEnabled || !habit.reminderTime) {
        console.log(`[Reminder] Skipping ${habit.name} - not active or no reminder enabled/time`)
        return
      }

      // Check if habit should be reminded today based on frequency
      const shouldRemind = shouldRemindToday(habit)
      console.log(`[Reminder] shouldRemindToday for ${habit.name}: ${shouldRemind}`)
      
      if (!shouldRemind) {
        return
      }

      // Parse reminder time robustly
      const [reminderHour, reminderMinute] = habit.reminderTime.split(':').map(Number)
      console.log(`[Reminder] Parsed reminder time for ${habit.name}: ${reminderHour}:${reminderMinute.toString().padStart(2, '0')}`)
      
      // Check if we're in the reminder time window (current minute or previous minute to account for timing)
      const isReminderTime = 
        (currentHour === reminderHour && currentMinute === reminderMinute) ||
        (currentHour === reminderHour && currentMinute === reminderMinute + 1) ||
        (currentHour === reminderHour && currentMinute === reminderMinute - 1)

      console.log(`[Reminder] Time match for ${habit.name}: current=${currentHour}:${currentMinute.toString().padStart(2, '0')}, reminder=${reminderHour}:${reminderMinute.toString().padStart(2, '0')}, isMatch=${isReminderTime}`)

      if (!isReminderTime) {
        return
      }

      // Check if already checked in today
      const alreadyCheckedIn = todayCheckIns.some(ci => ci.habitId === habit.id)
      console.log(`[Reminder] alreadyCheckedIn for ${habit.name}: ${alreadyCheckedIn}`)
      
      if (alreadyCheckedIn) {
        console.log(`[Reminder] Skipping ${habit.name} - already checked in today`)
        return
      }

      // Check if already reminded today
      const lastTriggerKey = lastReminderTriggers.get(habit.id)
      const alreadyRemindedToday = lastTriggerKey === today
      console.log(`[Reminder] alreadyRemindedToday for ${habit.name}: ${alreadyRemindedToday} (last: ${lastTriggerKey}, today: ${today})`)
      
      if (alreadyRemindedToday) {
        console.log(`[Reminder] Skipping ${habit.name} - already reminded today`)
        return
      }

      // Trigger notification
      console.log(`[Reminder] TRIGGERING notification for ${habit.name} at ${habit.reminderTime}`)
      const success = showNotification(habit.name, habit.icon)
      console.log(`[Reminder] showNotification result for ${habit.name}: ${success}`)
      
      if (success) {
        // Record that we reminded today
        lastReminderTriggers.set(habit.id, today)
        console.log(`[Reminder] Successfully triggered and recorded reminder for ${habit.name}`)
      } else {
        console.log(`[Reminder] Failed to trigger notification for ${habit.name}`)
      }
    })
  }, [profileData, permission, shouldRemindToday, showNotification])

  // Set up periodic reminder checking
  useEffect(() => {
    if (!isSupported || permission !== 'granted') {
      console.log(`[Reminder] Scheduler not starting - supported: ${isSupported}, permission: ${permission}`)
      return
    }

    console.log('[Reminder] Starting scheduler - checking every 30 seconds')
    
    // Check every 30 seconds for more reliable triggering
    const interval = setInterval(checkReminders, 30000)

    // Check immediately on mount
    console.log('[Reminder] Initial check on mount')
    checkReminders()

    return () => {
      console.log('[Reminder] Stopping scheduler')
      clearInterval(interval)
    }
  }, [isSupported, permission, checkReminders])

  return {
    // State
    permission,
    isSupported,
    
    // Actions
    requestPermission,
    showNotification,
    checkReminders,
    shouldRemindToday,
    testReminderForHabit,
    testReminderInOneMinute,
    getLastReminderInfo
  }
}
