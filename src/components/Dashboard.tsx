import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Target, Calendar, CheckCircle, TrendingUp } from 'lucide-react'
import { getIcon } from '../lib/iconMapping'
import { useAuth } from '../hooks/useAuth'
import { useCheckIns } from '../hooks/useCheckIns'
import type { Habit, CheckInStatus } from '../types'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { de } from 'date-fns/locale'

export function Dashboard() {
  const { profileData } = useAuth()
  const { createCheckIn, updateCheckIn, deleteCheckIn, getTodayCheckIns, isProcessing } = useCheckIns()
  const [todayHabits, setTodayHabits] = useState<Habit[]>([])
  const [todayCheckIns, setTodayCheckIns] = useState<Record<string, any>>({})
  const [quickNoteDialog, setQuickNoteDialog] = useState<{ habit: Habit; status: CheckInStatus } | null>(null)
  const [quantitativeDialog, setQuantitativeDialog] = useState<Habit | null>(null)
  const [noteText, setNoteText] = useState('')
  const [quantitativeValue, setQuantitativeValue] = useState('')

  useEffect(() => {
    if (!profileData) return

    const activeHabits = profileData.habits.filter(h => h.status === 'active')
    
    // Filter habits that are scheduled for today
    const scheduledToday = activeHabits.filter(habit => {
      const habitDate = new Date(habit.startDate)
      if (habitDate > new Date()) return false // Future habits

      const todayObj = new Date()
      const dayOfWeek = todayObj.getDay() || 7 // Convert Sunday (0) to 7

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
          return true // For x_per_week, we'll handle this differently
        default:
          return false
      }
    })

    setTodayHabits(scheduledToday)
    
    // Load today's check-ins
    const checkIns = getTodayCheckIns()
    const checkInMap: Record<string, any> = {}
    checkIns.forEach(ci => {
      checkInMap[ci.habitId] = ci
    })
    setTodayCheckIns(checkInMap)
  }, [profileData, getTodayCheckIns])

  const handleQuickCheckIn = async (habit: Habit, status: CheckInStatus) => {
    const currentStatus = getCheckInStatus(habit.id)
    
    // If clicking the same status, undo/remove it
    if (currentStatus === status) {
      await handleUndoCheckIn(habit.id)
      return
    }
    
    // Handle quantitative habits with 'done' status
    if (habit.type === 'quantitative' && status === 'done') {
      setQuantitativeDialog(habit)
      return
    }

    // For all other cases, create/update the check-in
    const success = await createCheckIn(habit.id, status)
    
    if (success) {
      // Refresh check-ins
      const checkIns = getTodayCheckIns()
      const checkInMap: Record<string, any> = {}
      checkIns.forEach(ci => {
        checkInMap[ci.habitId] = ci
      })
      setTodayCheckIns(checkInMap)
    }
  }

  const handleQuantitativeCheckIn = async (habit: Habit) => {
    const value = parseFloat(quantitativeValue)
    if (isNaN(value) || value <= 0) return

    const success = await createCheckIn(habit.id, 'done', value)
    if (success) {
      setQuantitativeDialog(null)
      setQuantitativeValue('')
      
      // Refresh check-ins
      const checkIns = getTodayCheckIns()
      const checkInMap: Record<string, any> = {}
      checkIns.forEach(ci => {
        checkInMap[ci.habitId] = ci
      })
      setTodayCheckIns(checkInMap)
    }
  }

  const handleNoteCheckIn = async (habit: Habit, status: CheckInStatus) => {
    const currentCheckIn = todayCheckIns[habit.id]
    
    // If there's already a check-in, update it with the new note
    if (currentCheckIn) {
      const success = await updateCheckIn(currentCheckIn.id, { note: noteText })
      if (success) {
        setQuickNoteDialog(null)
        setNoteText('')
        
        // Refresh check-ins
        const checkIns = getTodayCheckIns()
        const checkInMap: Record<string, any> = {}
        checkIns.forEach(ci => {
          checkInMap[ci.habitId] = ci
        })
        setTodayCheckIns(checkInMap)
      }
    } else {
      // If no check-in exists, create a new one with the requested status
      const value = status === 'done' && habit.type === 'quantitative' ? 1 : undefined
      const success = await createCheckIn(habit.id, status, value, noteText)
      if (success) {
        setQuickNoteDialog(null)
        setNoteText('')
        
        // Refresh check-ins
        const checkIns = getTodayCheckIns()
        const checkInMap: Record<string, any> = {}
        checkIns.forEach(ci => {
          checkInMap[ci.habitId] = ci
        })
        setTodayCheckIns(checkInMap)
      }
    }
  }

  const handleUndoCheckIn = async (habitId: string) => {
    const checkInId = todayCheckIns[habitId]?.id
    if (!checkInId) return
    
    const success = await deleteCheckIn(checkInId)
    if (success) {
      // Refresh check-ins
      const checkIns = getTodayCheckIns()
      const checkInMap: Record<string, any> = {}
      checkIns.forEach(ci => {
        checkInMap[ci.habitId] = ci
      })
      setTodayCheckIns(checkInMap)
    }
  }

  const getCheckInStatus = (habitId: string): CheckInStatus => {
    const checkIn = todayCheckIns[habitId]
    return checkIn?.status || 'not_scheduled'
  }

  const getCheckInValue = (habitId: string): number | undefined => {
    const checkIn = todayCheckIns[habitId]
    return checkIn?.value
  }

  const getCheckInNote = (habitId: string): string | undefined => {
    const checkIn = todayCheckIns[habitId]
    return checkIn?.note
  }

  const getCardClassName = (status: CheckInStatus) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 border-green-200'
      case 'missed':
        return 'bg-red-50 border-red-200'
      case 'skipped':
        return 'bg-yellow-50 border-yellow-200'
      case 'not_scheduled':
      default:
        return ''
    }
  }

  const completedCount = todayHabits.filter(habit => {
    const checkIn = todayCheckIns[habit.id]
    return checkIn?.status === 'done'
  }).length
  const totalCount = todayHabits.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Weekly stats
  const getWeeklyStats = () => {
    if (!profileData) return { completed: 0, total: 0, percentage: 0 }
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    let totalScheduled = 0
    let totalCompleted = 0
    
    weekDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayOfWeek = day.getDay() || 7
      
      todayHabits.forEach(habit => {
        const habitDate = new Date(habit.startDate)
        if (habitDate > day) return
        
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
            isScheduled = true
            break
        }
        
        if (isScheduled) {
          totalScheduled++
          const checkIn = profileData.checkIns.find(ci => ci.habitId === habit.id && ci.date === dayStr)
          if (checkIn?.status === 'done') {
            totalCompleted++
          }
        }
      })
    })
    
    const percentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0
    return { completed: totalCompleted, total: totalScheduled, percentage }
  }

  const weeklyStats = getWeeklyStats()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heute erledigt</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              von {totalCount} Habits ({completionPercentage}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              von {weeklyStats.total} geplant ({weeklyStats.percentage}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileData?.habits.filter(h => h.status === 'active').length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Gesamt: {profileData?.habits.length || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fortschritt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              Heutige Erfüllungsquote
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Diese Woche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{weeklyStats.completed}</div>
              <p className="text-sm text-muted-foreground">Erledigt</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{weeklyStats.total - weeklyStats.completed}</div>
              <p className="text-sm text-muted-foreground">Offen</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weeklyStats.percentage}%</div>
              <p className="text-sm text-muted-foreground">Erfüllungsquote</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Habits */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Heutige Habits</h2>
          <div className="text-sm text-muted-foreground">
            {completedCount} von {totalCount} erledigt
          </div>
        </div>

        {todayHabits.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-8 pb-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Heute keine geplanten Habits</h3>
                  <p className="text-muted-foreground">
                    Du hast heute keine aktiven Habits. Zeit für einen entspannten Tag!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {todayHabits.map(habit => {
              const status = getCheckInStatus(habit.id)
              const value = getCheckInValue(habit.id)
              const note = getCheckInNote(habit.id)
              
              return (
                <Card key={habit.id} className={getCardClassName(status)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className="w-12 h-12 rounded-xl border-2 border-white shadow-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: habit.color }}
                        >
                          {(() => {
                            const IconComponent = getIcon(habit.icon)
                            return <IconComponent className="w-6 h-6 text-white" />
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-base">{habit.name}</h3>
                            {habit.type === 'quantitative' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                Quantitativ
                              </span>
                            )}
                            {status !== 'not_scheduled' && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                status === 'done' ? 'bg-green-100 text-green-800' :
                                status === 'missed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {status === 'done' ? 'Erledigt' :
                                 status === 'missed' ? 'Verpasst' : 'Übersprungen'}
                              </span>
                            )}
                          </div>
                          {habit.description && (
                            <p className="text-sm text-muted-foreground">{habit.description}</p>
                          )}
                          {status === 'done' && (
                            <div className="mt-2 space-y-1">
                              {habit.type === 'quantitative' && value && (
                                <p className="text-sm font-medium text-green-700">
                                  Wert: {value} {habit.frequency.targetValue && `/ ${habit.frequency.targetValue}`}
                                </p>
                              )}
                            </div>
                          )}
                          {note && (
                            <p className="text-sm text-muted-foreground mt-2">Notiz: {note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary Actions */}
                    <div className="flex items-center space-x-2 mt-4">
                      <Button
                        size="sm"
                        variant={status === 'done' ? 'default' : 'outline'}
                        onClick={() => handleQuickCheckIn(habit, 'done')}
                        disabled={isProcessing}
                      >
                        Erledigt
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'missed' ? 'default' : 'outline'}
                        onClick={() => handleQuickCheckIn(habit, 'missed')}
                        disabled={isProcessing}
                      >
                        Verpasst
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'skipped' ? 'default' : 'outline'}
                        onClick={() => handleQuickCheckIn(habit, 'skipped')}
                        disabled={isProcessing}
                      >
                        Übersprungen
                      </Button>
                    </div>
                    
                    {/* Secondary Actions - nur wenn Status gesetzt */}
                    {status !== 'not_scheduled' && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/20">
                        <div className="flex items-center space-x-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              const currentCheckIn = todayCheckIns[habit.id]
                              setQuickNoteDialog({ habit, status })
                              setNoteText(currentCheckIn?.note || '')
                            }}
                            disabled={isProcessing}
                          >
                            {note ? 'Notiz bearbeiten' : 'Notiz hinzufügen'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7 px-2"
                            onClick={() => handleUndoCheckIn(habit.id)}
                            disabled={isProcessing}
                          >
                            Rückgängig
                          </Button>
                        </div>
                        
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Note Dialog */}
      <Dialog open={!!quickNoteDialog} onOpenChange={(open) => !open && setQuickNoteDialog(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Notiz hinzufügen</DialogTitle>
            <DialogDescription>
              Füge eine optionale Notiz zu diesem Check-in hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Notiz zu diesem Check-in..."
              rows={3}
            />
            <div className="flex space-x-3">
              <Button onClick={() => quickNoteDialog && handleNoteCheckIn(quickNoteDialog.habit, quickNoteDialog.status)} className="flex-1">
                Speichern
              </Button>
              <Button variant="outline" onClick={() => setQuickNoteDialog(null)} className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quantitative Value Dialog */}
      <Dialog open={!!quantitativeDialog} onOpenChange={(open) => !open && setQuantitativeDialog(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Wert eintragen</DialogTitle>
            <DialogDescription>
              Gib den Wert für diesen quantitativen Habit ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Wert für {quantitativeDialog?.name}
                {quantitativeDialog?.frequency.targetValue && ` (Ziel: ${quantitativeDialog.frequency.targetValue})`}
              </label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={quantitativeValue}
                onChange={(e) => setQuantitativeValue(e.target.value)}
                placeholder="z.B. 5.0"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => quantitativeDialog && handleQuantitativeCheckIn(quantitativeDialog)} className="flex-1">
                Speichern
              </Button>
              <Button variant="outline" onClick={() => setQuantitativeDialog(null)} className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
