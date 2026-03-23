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
    
    if (isNotificationSupported) {
      const currentPermission = Notification.permission as NotificationPermission
      setPermission(currentPermission)
      
      // Load saved permission from localStorage if available
      const savedPermission = localStorage.getItem('notificationPermission') as NotificationPermission
      if (savedPermission && savedPermission !== currentPermission) {
        // Permission might have changed in browser settings - silently handle
      }
    }
    
    setIsSupported(isNotificationSupported)
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
      return false
    }

    const habit = profileData.habits.find(h => h.id === habitId)
    
    if (!habit) {
      return false
    }

    // For testing, we allow testing even if reminder is not enabled
    const success = showNotification(habit.name, habit.icon)
    
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
    const success = showNotification(habit.name, habit.icon)
    
    if (success) {
      // Record that we reminded today for testing
      const today = new Date().toISOString().split('T')[0]
      lastReminderTriggers.set(habitId, today)
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
      return
    }

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const today = now.toISOString().split('T')[0]

    // Get today's check-ins to avoid duplicate notifications
    const todayCheckIns = profileData.checkIns.filter(ci => ci.date === today)

    profileData.habits.forEach((habit) => {
      // Only check active habits with enabled reminders
      if (habit.status !== 'active' || !habit.reminderEnabled || !habit.reminderTime) {
        return
      }

      // Check if habit should be reminded today based on frequency
      const shouldRemind = shouldRemindToday(habit)
      
      if (!shouldRemind) {
        return
      }

      // Parse reminder time robustly
      const [reminderHour, reminderMinute] = habit.reminderTime.split(':').map(Number)
      
      // Check if we're in the reminder time window (current minute or previous minute to account for timing)
      const isReminderTime = 
        (currentHour === reminderHour && currentMinute === reminderMinute) ||
        (currentHour === reminderHour && currentMinute === reminderMinute + 1) ||
        (currentHour === reminderHour && currentMinute === reminderMinute - 1)

      if (!isReminderTime) {
        return
      }

      // Check if already checked in today
      const alreadyCheckedIn = todayCheckIns.some(ci => ci.habitId === habit.id)
      
      if (alreadyCheckedIn) {
        return
      }

      // Check if already reminded today
      const lastTriggerKey = lastReminderTriggers.get(habit.id)
      const alreadyRemindedToday = lastTriggerKey === today
      
      if (alreadyRemindedToday) {
        return
      }

      // Trigger notification
      const success = showNotification(habit.name, habit.icon)
      
      if (success) {
        // Record that we reminded today
        lastReminderTriggers.set(habit.id, today)
      }
    })
  }, [profileData, permission, shouldRemindToday, showNotification])

  // Set up periodic reminder checking
  useEffect(() => {
    if (!isSupported || permission !== 'granted') {
      return
    }

    const interval = setInterval(checkReminders, 60000) // Check every minute

    return () => {
      clearInterval(interval)
    }
  }, [isSupported, permission, checkReminders])

  // Initial check on mount
  useEffect(() => {
    if (isSupported && permission === 'granted') {
      checkReminders()
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
