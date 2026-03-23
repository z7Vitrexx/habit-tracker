import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { CheckCircle2, Circle, X, SkipForward, Edit2, Trash2, Target } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCheckIns } from '../hooks/useCheckIns'
import type { Habit, CheckIn, CheckInStatus } from '../types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, subMonths, addMonths, subDays } from 'date-fns'
import { de } from 'date-fns/locale'

export function History() {
  const { profileData } = useAuth()
  const { getCheckInsForHabit, updateCheckIn, deleteCheckIn, getCheckInsForDate, getHabitsForDate, createCheckInForDate } = useCheckIns()
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'date'>('list')
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null)
  const [editNote, setEditNote] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterStatus, setFilterStatus] = useState<CheckInStatus | 'all' | 'hasNote' | 'missedOnly' | 'skippedOnly'>('all')
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days' | '90days'>('30days')

  const activeHabits = useMemo(() => profileData?.habits.filter(h => h.status === 'active') || [], [profileData])

  useEffect(() => {
    if (activeHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(activeHabits[0])
    }
  }, [activeHabits.length, selectedHabit])

  const getMonthDays = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }

  const getCheckInForDate = (date: Date): CheckIn | null => {
    if (!selectedHabit) return null
    const dateStr = format(date, 'yyyy-MM-dd')
    return profileData?.checkIns.find(ci => ci.habitId === selectedHabit.id && ci.date === dateStr) || null
  }

  const getStatusIcon = (status: CheckInStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'missed':
        return <X className="w-5 h-5 text-red-600" />
      case 'skipped':
        return <SkipForward className="w-5 h-5 text-yellow-600" />
      case 'not_scheduled':
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: CheckInStatus) => {
    switch (status) {
      case 'done':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Erledigt</span>
      case 'missed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Verpasst</span>
      case 'skipped':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Übersprungen</span>
      case 'not_scheduled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Nicht geplant</span>
    }
  }

  const getStatusLabel = (status: CheckInStatus) => {
    switch (status) {
      case 'done':
        return 'Erledigt'
      case 'missed':
        return 'Verpasst'
      case 'skipped':
        return 'Übersprungen'
      case 'not_scheduled':
        return 'Nicht geplant'
    }
  }

  const handleUpdateNote = async (checkInId: string, note: string) => {
    const success = await updateCheckIn(checkInId, { note })
    if (success) {
      setEditingCheckIn(null)
      setEditNote('')
    } else {
      alert('Aktualisieren fehlgeschlagen')
    }
  }

  const handleDeleteCheckIn = async (checkInId: string) => {
    const success = await deleteCheckIn(checkInId)
    if (!success) {
      alert('Löschen fehlgeschlagen')
    }
  }

  const getFilteredCheckIns = useMemo(() => {
    if (!selectedHabit) return []
    
    let checkIns = getCheckInsForHabit(selectedHabit.id)
    
    // Enhanced status filters
    if (filterStatus === 'hasNote') {
      checkIns = checkIns.filter(ci => ci.note && ci.note.trim() !== '')
    } else if (filterStatus === 'missedOnly') {
      checkIns = checkIns.filter(ci => ci.status === 'missed')
    } else if (filterStatus === 'skippedOnly') {
      checkIns = checkIns.filter(ci => ci.status === 'skipped')
    } else if (filterStatus !== 'all') {
      checkIns = checkIns.filter(ci => ci.status === filterStatus)
    }
    
    // Time filter
    if (timeFilter === '7days') {
      const cutoffDate = subDays(new Date(), 7)
      checkIns = checkIns.filter(ci => new Date(ci.date) >= cutoffDate)
    } else if (timeFilter === '30days') {
      const cutoffDate = subDays(new Date(), 30)
      checkIns = checkIns.filter(ci => new Date(ci.date) >= cutoffDate)
    } else if (timeFilter === '90days') {
      const cutoffDate = subDays(new Date(), 90)
      checkIns = checkIns.filter(ci => new Date(ci.date) >= cutoffDate)
    }
    
    return checkIns.sort((a, b) => b.date.localeCompare(a.date))
  }, [selectedHabit, filterStatus, timeFilter, getCheckInsForHabit])

  // Group check-ins by date for better orientation
  const getGroupedCheckIns = useMemo(() => {
    const filtered = getFilteredCheckIns
    const groups: { [key: string]: typeof filtered } = {}
    
    filtered.forEach(checkIn => {
      const date = new Date(checkIn.date)
      const today = new Date()
      const yesterday = subDays(today, 1)
      const weekStart = subDays(today, today.getDay() === 0 ? 6 : today.getDay() - 1)
      
      let groupKey = ''
      if (isSameDay(date, today)) {
        groupKey = 'Heute'
      } else if (isSameDay(date, yesterday)) {
        groupKey = 'Gestern'
      } else if (date >= weekStart) {
        groupKey = 'Diese Woche'
      } else {
        groupKey = format(date, 'MMMM yyyy', { locale: de })
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(checkIn)
    })
    
    return groups
  }, [getFilteredCheckIns])

  const getHabitsForSelectedDate = () => {
    return getHabitsForDate(selectedDate)
  }

  const getCheckInsForSelectedDate = () => {
    return getCheckInsForDate(selectedDate)
  }

  const handleCreateCheckInForDate = async (habitId: string, status: CheckInStatus, value?: number, note?: string) => {
    const success = await createCheckInForDate(habitId, selectedDate, status, value, note)
    if (!success) {
      alert('Erstellen fehlgeschlagen')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Verlauf</h2>
        <p className="text-muted-foreground">
          Analysiere deine Fortschritte und Einträge
        </p>
      </div>

      {/* View Mode Selection */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Liste
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            Kalender
          </Button>
          <Button
            variant={viewMode === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('date')}
          >
            Tagesansicht
          </Button>
        </div>

        {/* Context-dependent Controls */}
        {viewMode === 'list' && (
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <select
              value={selectedHabit?.id || ''}
              onChange={(e) => {
                const habit = activeHabits.find(h => h.id === e.target.value)
                setSelectedHabit(habit || null)
              }}
              className="px-3 py-1 border rounded text-sm"
            >
              {activeHabits.map(habit => (
                <option key={habit.id} value={habit.id}>{habit.name}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CheckInStatus | 'all' | 'hasNote' | 'missedOnly' | 'skippedOnly')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">Alle Status</option>
              <option value="done">Erledigt</option>
              <option value="missed">Verpasst</option>
              <option value="skipped">Übersprungen</option>
              <option value="hasNote">Mit Notiz</option>
              <option value="missedOnly">Nur verpasste</option>
              <option value="skippedOnly">Nur übersprungene</option>
            </select>
            
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'all' | '7days' | '30days' | '90days')}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">Alle Zeit</option>
              <option value="7days">Letzte 7 Tage</option>
              <option value="30days">Letzte 30 Tage</option>
              <option value="90days">Letzte 90 Tage</option>
            </select>
          </div>
        )}

        {viewMode === 'calendar' && selectedHabit && (
          <div className="flex items-center space-x-2">
            <select
              value={selectedHabit?.id || ''}
              onChange={(e) => {
                const habit = activeHabits.find(h => h.id === e.target.value)
                setSelectedHabit(habit || null)
              }}
              className="px-3 py-1 border rounded text-sm"
            >
              {activeHabits.map(habit => (
                <option key={habit.id} value={habit.id}>{habit.name}</option>
              ))}
            </select>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                ←
              </Button>
              <span className="font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                disabled={isSameMonth(currentMonth, new Date())}
              >
                →
              </Button>
            </div>
          </div>
        )}

        {viewMode === 'date' && (
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            />
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && selectedHabit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedHabit.color }}
              />
              <span>{selectedHabit.name} - Verlauf</span>
            </CardTitle>
            <CardDescription>
              {selectedHabit.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getFilteredCheckIns.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Keine Einträge gefunden</h3>
                <p className="text-muted-foreground">
                  {filterStatus === 'hasNote' 
                    ? 'Keine Einträge mit Notizen vorhanden'
                    : filterStatus === 'missedOnly'
                    ? 'Keine verpassten Einträge vorhanden'
                    : filterStatus === 'skippedOnly'
                    ? 'Keine übersprungenen Einträge vorhanden'
                    : timeFilter === 'all' 
                    ? 'Keine Einträge für diesen Habit vorhanden'
                    : `Keine Einträge im gewählten Zeitraum (${timeFilter === '7days' ? 'letzte 7 Tage' : timeFilter === '30days' ? 'letzte 30 Tage' : 'letzte 90 Tage'})`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(getGroupedCheckIns).map(([groupName, checkIns]) => (
                  <div key={groupName}>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-3 sticky top-0 bg-background pb-2 border-b">
                      {groupName}
                    </h3>
                    <div className="space-y-2">
                      {checkIns.map((checkIn: CheckIn) => (
                        <div
                          key={checkIn.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {getStatusBadge(checkIn.status)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">
                                {format(new Date(checkIn.date), 'EEEE, d. MMMM', { locale: de })}
                              </div>
                              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                {checkIn.value && (
                                  <span className="font-medium">Wert: {checkIn.value}</span>
                                )}
                                {checkIn.note && (
                                  <span className="italic truncate max-w-xs">Notiz: {checkIn.note}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCheckIn(checkIn)
                                setEditNote(checkIn.note || '')
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCheckIn(checkIn.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'calendar' && selectedHabit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedHabit.color }}
              />
              <span>{selectedHabit.name}</span>
            </CardTitle>
            <CardDescription>
              {selectedHabit.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="text-center text-sm font-medium p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getMonthDays().map(day => {
                const checkIn = getCheckInForDate(day)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`border rounded-lg p-2 min-h-[60px] ${
                      isToday ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    {checkIn && (
                      <div className="flex flex-col items-center space-y-1">
                        {getStatusIcon(checkIn.status)}
                        <div className="text-xs text-center">
                          {getStatusLabel(checkIn.status)}
                        </div>
                        {checkIn.note && (
                          <div className="text-xs text-muted-foreground text-center truncate w-full">
                            {checkIn.note}
                          </div>
                        )}
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCheckIn(checkIn)
                              setEditNote(checkIn.note || '')
                            }}
                            className="p-1 h-6"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCheckIn(checkIn.id)}
                            className="p-1 h-6"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date View - Inline Display */}
      {viewMode === 'date' && (
        <Card>
          <CardHeader>
            <CardTitle>
              Habits für {format(new Date(selectedDate), 'EEEE, d. MMMM yyyy', { locale: de })}
            </CardTitle>
            <CardDescription>
              Bearbeite die Einträge für diesen Tag
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getHabitsForSelectedDate().length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Keine Habits geplant</h3>
                <p className="text-muted-foreground">
                  Für diesen Tag sind keine Habits geplant oder verfügbar.
                </p>
              </div>
            ) : (
              <>
                {/* Day Summary */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Tagesübersicht</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {getCheckInsForSelectedDate().filter(ci => ci.status === 'done').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Erledigt</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">
                        {getCheckInsForSelectedDate().filter(ci => ci.status === 'missed').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Verpasst</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-600">
                        {getCheckInsForSelectedDate().filter(ci => ci.status === 'skipped').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Übersprungen</div>
                    </div>
                  </div>
                </div>

                {/* Habits List */}
                <div className="grid gap-4">
                  {getHabitsForSelectedDate().map(habit => {
                    const checkIn = getCheckInsForSelectedDate().find(ci => ci.habitId === habit.id)
                    
                    return (
                      <Card key={habit.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div
                                className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                                style={{ backgroundColor: habit.color }}
                              >
                                {habit.icon ? (
                                  <span className="text-white text-lg">{habit.icon}</span>
                                ) : (
                                  <Target className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium">{habit.name}</h3>
                                  {habit.type === 'quantitative' && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      Quantitativ
                                    </span>
                                  )}
                                  {checkIn && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      checkIn.status === 'done' ? 'bg-green-100 text-green-800' :
                                      checkIn.status === 'missed' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {checkIn.status === 'done' ? 'Erledigt' :
                                       checkIn.status === 'missed' ? 'Verpasst' : 'Übersprungen'}
                                    </span>
                                  )}
                                </div>
                                {habit.description && (
                                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                                )}
                                {checkIn && (
                                  <div className="mt-2 space-y-1">
                                    {habit.type === 'quantitative' && checkIn.value && (
                                      <p className="text-sm font-medium text-green-700">
                                        Wert: {checkIn.value} {habit.frequency.targetValue && `/ ${habit.frequency.targetValue}`}
                                      </p>
                                    )}
                                    {checkIn.note && (
                                      <p className="text-sm text-muted-foreground italic">Notiz: {checkIn.note}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-4">
                            {checkIn ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCheckIn(checkIn)
                                    setEditNote(checkIn.note || '')
                                  }}
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  Bearbeiten
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteCheckIn(checkIn.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Löschen
                                </Button>
                              </>
                            ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleCreateCheckInForDate(habit.id, 'done')}
                              >
                                Erledigt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateCheckInForDate(habit.id, 'missed')}
                              >
                                Verpasst
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCreateCheckInForDate(habit.id, 'skipped')}
                              >
                                Übersprungen
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Note Modal */}
      {editingCheckIn && (
        <Dialog open={!!editingCheckIn} onOpenChange={(open) => !open && setEditingCheckIn(null)}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Notiz bearbeiten</DialogTitle>
              <DialogDescription>
                Passe die Notiz für diesen Check-in an.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Notiz zu diesem Check-in..."
                rows={3}
              />
              <div className="flex space-x-3">
                <Button 
                  onClick={() => {
                    if (editingCheckIn) {
                      handleUpdateNote(editingCheckIn.id, editNote)
                    }
                  }} 
                  className="flex-1"
                >
                  Speichern
                </Button>
                <Button variant="outline" onClick={() => setEditingCheckIn(null)} className="flex-1">
                  Abbrechen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default History
