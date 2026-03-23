import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import type { CheckIn, CheckInStatus, Habit } from '../types'
import { format, isToday, startOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export function useCheckIns() {
  const { profileData, saveProfileData } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const createCheckIn = useCallback(async (
    habitId: string,
    status: CheckInStatus,
    value?: number,
    note?: string
  ): Promise<boolean> => {
    if (!profileData || isProcessing) return false

    setIsProcessing(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      // Check if check-in already exists for today
      const existingCheckIn = profileData.checkIns.find(
        ci => ci.habitId === habitId && ci.date === today
      )

      const checkIn: CheckIn = {
        id: existingCheckIn?.id || crypto.randomUUID(),
        habitId,
        date: today,
        status,
        value,
        note,
        createdAt: existingCheckIn?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedCheckIns = existingCheckIn
        ? profileData.checkIns.map(ci => ci.id === existingCheckIn.id ? checkIn : ci)
        : [...profileData.checkIns, checkIn]

      const updatedProfileData = {
        ...profileData,
        checkIns: updatedCheckIns,
      }

      const success = await saveProfileData(updatedProfileData)
      return success
    } catch (error) {
      console.error('Error creating check-in:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [profileData, saveProfileData, isProcessing])

  const createCheckInForDate = useCallback(async (
    habitId: string,
    date: string,
    status: CheckInStatus,
    value?: number,
    note?: string
  ): Promise<boolean> => {
    if (!profileData || isProcessing) return false

    setIsProcessing(true)
    try {
      // Check if check-in already exists for this date
      const existingCheckIn = profileData.checkIns.find(
        ci => ci.habitId === habitId && ci.date === date
      )

      const checkIn: CheckIn = {
        id: existingCheckIn?.id || crypto.randomUUID(),
        habitId,
        date,
        status,
        value,
        note,
        createdAt: existingCheckIn?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedCheckIns = existingCheckIn
        ? profileData.checkIns.map(ci => ci.id === existingCheckIn.id ? checkIn : ci)
        : [...profileData.checkIns, checkIn]

      const updatedProfileData = {
        ...profileData,
        checkIns: updatedCheckIns,
      }

      const success = await saveProfileData(updatedProfileData)
      return success
    } catch (error) {
      console.error('Error creating check-in:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [profileData, saveProfileData, isProcessing])

  const updateCheckIn = useCallback(async (
    checkInId: string,
    updates: Partial<Pick<CheckIn, 'status' | 'value' | 'note'>>
  ): Promise<boolean> => {
    if (!profileData || isProcessing) return false

    setIsProcessing(true)
    try {
      const updatedCheckIns = profileData.checkIns.map(ci => 
        ci.id === checkInId ? { ...ci, ...updates, updatedAt: new Date().toISOString() } : ci
      )
      
      const updatedProfileData = {
        ...profileData,
        checkIns: updatedCheckIns,
      }

      const success = await saveProfileData(updatedProfileData)
      return success
    } catch (error) {
      console.error('Error updating check-in:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [profileData, saveProfileData, isProcessing])

  const deleteCheckIn = useCallback(async (checkInId: string): Promise<boolean> => {
    if (!profileData || isProcessing) return false

    setIsProcessing(true)
    try {
      const updatedCheckIns = profileData.checkIns.filter(ci => ci.id !== checkInId)
      
      const updatedProfileData = {
        ...profileData,
        checkIns: updatedCheckIns,
      }

      const success = await saveProfileData(updatedProfileData)
      return success
    } catch (error) {
      console.error('Error deleting check-in:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [profileData, saveProfileData, isProcessing])

  const shouldScheduleXPerWeek = useCallback((habit: Habit, date: string): boolean => {
    if (habit.frequency.type !== 'x_per_week') return false
    
    const targetDays = habit.frequency.xPerWeek || 3
    const dateObj = new Date(date)
    const habitStart = new Date(habit.startDate)
    
    // Don't schedule before start date
    if (dateObj < habitStart) return false
    
    // Get the week start for this date
    const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(dateObj, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    // Count completed check-ins for this week
    const completedThisWeek = weekDays.reduce((count, day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const checkIn = profileData?.checkIns.find(ci => ci.habitId === habit.id && ci.date === dayStr)
      return checkIn?.status === 'done' ? count + 1 : count
    }, 0)
    
    // If already completed target days for this week, don't schedule more
    if (completedThisWeek >= targetDays) {
      return false
    }
    
    // Schedule for remaining days of the week
    const remainingDays = weekDays.filter(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      if (dayStr < date) return false // Past days
      
      const checkIn = profileData?.checkIns.find(ci => ci.habitId === habit.id && ci.date === dayStr)
      return !checkIn || checkIn.status !== 'done'
    })
    
    // Distribute remaining days evenly
    const remainingNeeded = targetDays - completedThisWeek
    const dayIndex = remainingDays.findIndex(day => format(day, 'yyyy-MM-dd') === date)
    
    if (dayIndex === -1) return false
    
    // Schedule if this day is one of the needed remaining days
    const scheduleEveryNthDay = Math.max(1, Math.floor(remainingDays.length / remainingNeeded))
    return dayIndex % scheduleEveryNthDay === 0
  }, [profileData])

  const getHabitsForDate = useCallback((date: string): Habit[] => {
    if (!profileData) return []
    
    const activeHabits = profileData.habits.filter(h => h.status === 'active')
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay() || 7 // Convert Sunday (0) to 7
    
    return activeHabits.filter(habit => {
      const habitDate = new Date(habit.startDate)
      if (habitDate > dateObj) return false // Future habits

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
          // Check if this habit should be scheduled for this date
          return shouldScheduleXPerWeek(habit, date)
        default:
          return false
      }
    })
  }, [profileData, shouldScheduleXPerWeek])

  const getCheckInForDate = useCallback((habitId: string, date: string): CheckIn | null => {
    if (!profileData) return null
    return profileData.checkIns.find(ci => ci.habitId === habitId && ci.date === date) || null
  }, [profileData])

  const getCheckInsForDate = useCallback((date: string): CheckIn[] => {
    if (!profileData) return []
    return profileData.checkIns.filter(ci => ci.date === date)
  }, [profileData])

  const getCheckInsForHabit = useCallback((habitId: string): CheckIn[] => {
    if (!profileData) return []
    return profileData.checkIns.filter(ci => ci.habitId === habitId).sort((a, b) => b.date.localeCompare(a.date))
  }, [profileData])

  const getTodayCheckIns = useCallback((): CheckIn[] => {
    if (!profileData) return []
    const today = format(new Date(), 'yyyy-MM-dd')
    return profileData.checkIns.filter(ci => ci.date === today)
  }, [profileData])

  const getMissedDays = useCallback((habitId: string, startDate: string): string[] => {
    if (!profileData) return []
    
    const missed: string[] = []
    const start = startOfDay(new Date(startDate))
    const today = startOfDay(new Date())
    
    for (let date = start; date <= today; date.setDate(date.getDate() + 1)) {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Skip future dates
      if (new Date(dateStr) > new Date()) continue
      
      // Skip today if not completed yet
      if (isToday(date)) continue
      
      const checkIn = getCheckInForDate(habitId, dateStr)
      if (!checkIn || checkIn.status === 'missed') {
        missed.push(dateStr)
      }
    }
    
    return missed
  }, [profileData, getCheckInForDate])

  const undoCheckIn = useCallback(async (habitId: string, date: string): Promise<boolean> => {
    if (!profileData || isProcessing) return false

    setIsProcessing(true)
    try {
      const updatedCheckIns = profileData.checkIns.filter(ci => !(ci.habitId === habitId && ci.date === date))
      
      const updatedProfileData = {
        ...profileData,
        checkIns: updatedCheckIns,
      }

      const success = await saveProfileData(updatedProfileData)
      return success
    } catch (error) {
      console.error('Error undoing check-in:', error)
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [profileData, saveProfileData, isProcessing])

  const getCompletionRate = useCallback((habitId: string, days: number): number => {
    if (!profileData) return 0
    
    const habit = profileData.habits.find(h => h.id === habitId)
    if (!habit) return 0
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    
    let completedDays = 0
    let totalScheduledDays = 0
    
    for (let date = new Date(startDate); date <= endDate; ) {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      // Check if habit was scheduled for this date
      const habitDate = new Date(habit.startDate)
      if (habitDate > date) {
        date.setDate(date.getDate() + 1)
        continue // Habit didn't exist yet
      }
      
      const dayOfWeek = date.getDay() || 7 // Convert Sunday (0) to 7
      let isScheduled = false
      
      switch (habit.frequency.type) {
        case 'daily':
          isScheduled = true
          break
        case 'weekdays':
          isScheduled = dayOfWeek >= 1 && dayOfWeek <= 5
          break
        case 'weekends':
          isScheduled = dayOfWeek === 6 || dayOfWeek === 7
          break
        case 'custom':
          isScheduled = habit.frequency.weekdays?.includes(dayOfWeek) || false
          break
        case 'x_per_week':
          isScheduled = true // Simplified - would need week-based logic
          break
      }
      
      if (isScheduled) {
        totalScheduledDays++
        const checkIn = getCheckInForDate(habitId, dateStr)
        if (checkIn?.status === 'done') {
          completedDays++
        }
      }
      
      date.setDate(date.getDate() + 1)
    }
    
    return totalScheduledDays > 0 ? Math.round((completedDays / totalScheduledDays) * 100) : 0
  }, [profileData, getCheckInForDate])

  const getCurrentStreak = useCallback((habitId: string): number => {
    if (!profileData) return 0
    
    const habit = profileData.habits.find(h => h.id === habitId)
    if (!habit) return 0
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setDate(currentDate.getDate() - 1) // Start with yesterday
    
    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      
      // Check if habit existed on this date
      const habitDate = new Date(habit.startDate)
      if (habitDate > currentDate) break
      
      // Check if habit was scheduled for this date
      const dayOfWeek = currentDate.getDay() || 7
      let isScheduled = false
      
      switch (habit.frequency.type) {
        case 'daily':
          isScheduled = true
          break
        case 'weekdays':
          isScheduled = dayOfWeek >= 1 && dayOfWeek <= 5
          break
        case 'weekends':
          isScheduled = dayOfWeek === 6 || dayOfWeek === 7
          break
        case 'custom':
          isScheduled = habit.frequency.weekdays?.includes(dayOfWeek) || false
          break
        case 'x_per_week':
          isScheduled = true // Simplified
          break
      }
      
      if (isScheduled) {
        const checkIn = getCheckInForDate(habitId, dateStr)
        if (checkIn?.status === 'done') {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        } else {
          break
        }
      } else {
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }
    
    return streak
  }, [profileData, getCheckInForDate])

  const getLongestStreak = useCallback((habitId: string): number => {
    if (!profileData) return 0
    
    const habit = profileData.habits.find(h => h.id === habitId)
    if (!habit) return 0
    
    const checkIns = getCheckInsForHabit(habitId)
    let longestStreak = 0
    let currentStreak = 0
    
    checkIns.forEach(checkIn => {
      if (checkIn.status === 'done') {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else if (checkIn.status === 'missed') {
        currentStreak = 0
      }
      // skipped and not_scheduled don't break streak
    })
    
    return longestStreak
  }, [profileData, getCheckInsForHabit])

  return {
    createCheckIn,
    createCheckInForDate,
    updateCheckIn,
    deleteCheckIn,
    getCheckInForDate,
    getCheckInsForDate,
    getHabitsForDate,
    getCheckInsForHabit,
    getTodayCheckIns,
    getMissedDays,
    undoCheckIn,
    getCompletionRate,
    getCurrentStreak,
    getLongestStreak,
    isProcessing,
  }
}
