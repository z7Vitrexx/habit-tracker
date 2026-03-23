import { useState, useEffect, useMemo } from 'react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { TrendingUp, Calendar, Target, Zap, BarChart3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useCheckIns } from '../hooks/useCheckIns'
import type { Habit } from '../types'
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

export function Statistics() {
  const { profileData } = useAuth()
  const { getCompletionRate, getCurrentStreak, getLongestStreak } = useCheckIns()
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30')

  const activeHabits = useMemo(() => profileData?.habits.filter(h => h.status === 'active') || [], [profileData])

  useEffect(() => {
    if (activeHabits.length > 0 && !selectedHabit) {
      setSelectedHabit(activeHabits[0])
    }
  }, [activeHabits, selectedHabit])

  const getOverallStats = useMemo(() => {
    if (!profileData) return { totalHabits: 0, activeHabits: 0, pausedHabits: 0, avgCompletionRate: 0, totalCheckIns: 0 }

    const totalHabits = profileData.habits.length
    const activeHabitsList = profileData.habits.filter(h => h.status === 'active')
    const pausedHabits = profileData.habits.filter(h => h.status === 'paused').length
    const totalCheckIns = profileData.checkIns.filter(ci => ci.status === 'done').length
    
    // Calculate average completion rate for active habits only
    const avgCompletionRate = activeHabitsList.length > 0
      ? Math.round(
          activeHabitsList.reduce((sum: number, habit: Habit) => sum + getCompletionRate(habit.id, parseInt(timeRange)), 0) / activeHabitsList.length
        )
      : 0

    return { totalHabits, activeHabits: activeHabitsList.length, pausedHabits, avgCompletionRate, totalCheckIns }
  }, [profileData, getCompletionRate, timeRange])

  const getHabitStats = (habit: Habit) => {
    const currentStreak = getCurrentStreak(habit.id)
    const longestStreak = getLongestStreak(habit.id)
    const completionRate7 = getCompletionRate(habit.id, 7)
    const completionRate30 = getCompletionRate(habit.id, 30)
    const completionRate90 = getCompletionRate(habit.id, 90)
    
    // For quantitative habits, calculate additional stats
    const quantitativeStats = habit.type === 'quantitative' ? {
      averageValue: getAverageValue(habit.id),
      totalValue: getTotalValue(habit.id),
      bestValue: getBestValue(habit.id),
      trend: getValueTrend(habit.id)
    } : null
    
    return {
      currentStreak,
      longestStreak,
      completionRate7,
      completionRate30,
      completionRate90,
      quantitativeStats
    }
  }

  const getAverageValue = (habitId: string): number => {
    if (!profileData) return 0
    const checkIns = profileData.checkIns.filter(ci => ci.habitId === habitId && ci.status === 'done' && ci.value)
    if (checkIns.length === 0) return 0
    const sum = checkIns.reduce((acc, ci) => acc + (ci.value || 0), 0)
    return Math.round((sum / checkIns.length) * 10) / 10
  }

  const getTotalValue = (habitId: string): number => {
    if (!profileData) return 0
    return profileData.checkIns
      .filter(ci => ci.habitId === habitId && ci.status === 'done' && ci.value)
      .reduce((acc, ci) => acc + (ci.value || 0), 0)
  }

  const getBestValue = (habitId: string): number => {
    if (!profileData) return 0
    const values = profileData.checkIns
      .filter(ci => ci.habitId === habitId && ci.status === 'done' && ci.value)
      .map(ci => ci.value || 0)
    return values.length > 0 ? Math.max(...values) : 0
  }

  const getValueTrend = (habitId: string): 'up' | 'down' | 'stable' => {
    if (!profileData) return 'stable'
    const recentCheckIns = profileData.checkIns
      .filter(ci => ci.habitId === habitId && ci.status === 'done' && ci.value)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
    
    if (recentCheckIns.length < 3) return 'stable'
    
    const firstHalf = recentCheckIns.slice(0, Math.floor(recentCheckIns.length / 2))
    const secondHalf = recentCheckIns.slice(Math.floor(recentCheckIns.length / 2))
    
    const firstAvg = firstHalf.reduce((acc, ci) => acc + (ci.value || 0), 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((acc, ci) => acc + (ci.value || 0), 0) / secondHalf.length
    
    const diff = secondAvg - firstAvg
    if (diff > 0.1) return 'up'
    if (diff < -0.1) return 'down'
    return 'stable'
  }

  const getTrendData = () => {
    if (!selectedHabit) return []

    const days = parseInt(timeRange)
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)

    const data = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const checkIn = profileData?.checkIns.find(ci => ci.habitId === selectedHabit.id && ci.date === dateStr)
      
      return {
        date: format(date, 'dd.MM'),
        completed: checkIn?.status === 'done' ? 1 : 0,
        skipped: checkIn?.status === 'skipped' ? 1 : 0,
        missed: checkIn?.status === 'missed' ? 1 : 0,
      }
    })

    return data
  }

  const getWeeklyData = () => {
    if (!profileData) return []

    const weeks = []
    const today = new Date()
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      
      // Calculate planned units for this week based on active habits and their frequencies
      const plannedUnits = activeHabits.reduce((total, habit) => {
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
        const plannedDays = weekDays.filter(day => {
          const dayOfWeek = day.getDay() === 0 ? 7 : day.getDay()
          switch (habit.frequency.type) {
            case 'daily': return true
            case 'weekdays': return dayOfWeek >= 1 && dayOfWeek <= 5
            case 'weekends': return dayOfWeek === 6 || dayOfWeek === 7
            case 'custom': return habit.frequency.weekdays?.includes(dayOfWeek) || false
            case 'x_per_week': return true // Will be handled separately
            default: return false
          }
        }).length
        
        // For x_per_week, use the target count
        if (habit.frequency.type === 'x_per_week') {
          return total + (habit.frequency.xPerWeek || 1)
        }
        
        return total + plannedDays
      }, 0)
      
      const weekCheckIns = profileData.checkIns.filter(ci => {
        const ciDate = new Date(ci.date)
        return ciDate >= weekStart && ciDate <= weekEnd && ci.status === 'done'
      })

      const skippedCheckIns = profileData.checkIns.filter(ci => {
        const ciDate = new Date(ci.date)
        return ciDate >= weekStart && ciDate <= weekEnd && ci.status === 'skipped'
      })

      const missedCheckIns = profileData.checkIns.filter(ci => {
        const ciDate = new Date(ci.date)
        return ciDate >= weekStart && ciDate <= weekEnd && ci.status === 'missed'
      })

      weeks.push({
        week: format(weekStart, 'dd.MM'),
        completed: weekCheckIns.length,
        skipped: skippedCheckIns.length,
        missed: missedCheckIns.length,
        planned: plannedUnits,
        completionRate: plannedUnits > 0 ? Math.round((weekCheckIns.length / plannedUnits) * 100) : 0
      })
    }

    return weeks
  }

  const getWeeklyInsight = () => {
    if (!profileData || activeHabits.length === 0) return null
    
    const currentWeek = getWeeklyData()[0] // Most recent week
    if (!currentWeek) return null
    
    const { completed, planned } = currentWeek
    
    if (planned === 0) {
      return "Diese Woche sind keine geplanten Einheiten angesetzt."
    }
    
    const completionRate = Math.round((completed / planned) * 100)
    
    if (completionRate >= 100) {
      return `🎯 Perfekt! Du hast alle ${planned} geplanten Einheiten diese Woche geschafft.`
    } else if (completionRate >= 80) {
      return `👍 Sehr gut! Du hast ${completed} von ${planned} geplanten Einheiten geschafft (${completionRate}%).`
    } else if (completionRate >= 60) {
      return `📈 Gut unterwegs! ${completed} von ${planned} Einheiten geschafft (${completionRate}%).`
    } else {
      return `💪 Weitermachen! ${completed} von ${planned} Einheiten geschafft (${completionRate}%).`
    }
  }

  const getHabitInsight = (habit: Habit) => {
    const stats = getHabitStats(habit)
    const { currentStreak, completionRate7, completionRate30 } = stats
    
    if (habit.type === 'quantitative') {
      const avgValue = stats.quantitativeStats?.averageValue || 0
      const targetValue = habit.frequency.targetValue || 0
      
      if (targetValue > 0) {
        const achievementRate = Math.round((avgValue / targetValue) * 100)
        if (achievementRate >= 100) {
          return `🎯 Ziel übertroffen! Durchschnittlich ${avgValue} (Ziel: ${targetValue})`
        } else if (achievementRate >= 80) {
          return `📈 Fast da! Durchschnittlich ${avgValue} von ${targetValue} erreicht`
        } else {
          return `💪 Raum für Verbesserung: ${avgValue} von ${targetValue} im Durchschnitt`
        }
      } else {
        return `📊 Durchschnittlich ${avgValue} pro Einheit`
      }
    } else {
      // Binary habits
      if (currentStreak >= 7) {
        return `🔥 Super! Aktuelle Serie: ${currentStreak} Tage`
      } else if (completionRate30 >= 80) {
        return `👍 Sehr konsistent! ${completionRate30}% in den letzten 30 Tagen`
      } else if (completionRate7 >= 80) {
        return `📈 Gute Woche! ${completionRate7}% in den letzten 7 Tagen`
      } else if (currentStreak > 0) {
        return `💪 Dran bleiben! Aktuelle Serie: ${currentStreak} Tage`
      } else {
        return `🌱 Neue Serie starten!`
      }
    }
  }

  const getHeatmapData = () => {
    if (!selectedHabit) return []

    const data = []
    const today = new Date()
    const startDate = subDays(today, 364) // Last year

    for (let date = new Date(startDate); date <= today; date.setDate(date.getDate() + 1)) {
      const dateStr = format(date, 'yyyy-MM-dd')
      const checkIn = profileData?.checkIns.find(ci => ci.habitId === selectedHabit.id && ci.date === dateStr)
      
      data.push({
        date: dateStr,
        value: checkIn?.status === 'done' ? 1 : checkIn?.status === 'skipped' ? 0.5 : 0,
        day: format(date, 'EEE', { locale: de }),
        week: Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)),
      })
    }

    return data
  }

  const overallStats = getOverallStats
  const habitStats = selectedHabit ? getHabitStats(selectedHabit) : null
  const trendData = selectedHabit ? getTrendData() : []
  const weeklyData = getWeeklyData()
  const heatmapData = getHeatmapData()

  // Memoize expensive calculations
  const weeklyInsight = useMemo(() => getWeeklyInsight(), [weeklyData])
  const habitInsight = useMemo(() => selectedHabit ? getHabitInsight(selectedHabit) : null, [selectedHabit, habitStats])

  if (activeHabits.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Statistiken</h2>
          <p className="text-muted-foreground">
            Analysiere deine Fortschritte und Trends
          </p>
        </div>
        
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine aktiven Gewohnheiten</h3>
            <p className="text-muted-foreground">
              Erstelle zuerst Gewohnheiten, um Statistiken zu sehen.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Statistiken</h2>
        <p className="text-muted-foreground">
          Analysiere deine Fortschritte und Trends
        </p>
      </div>

      {/* Weekly Insight Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Wochen-Übersicht</span>
          </CardTitle>
          <CardDescription>
            Deine Leistung in dieser Woche
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                {weeklyInsight}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {getWeeklyData()[0]?.completed || 0}
                </div>
                <div className="text-xs text-muted-foreground">Geschafft</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {getWeeklyData()[0]?.planned || 0}
                </div>
                <div className="text-xs text-muted-foreground">Geplant</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {getWeeklyData()[0]?.completionRate || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Quote</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Gewohnheiten</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalHabits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtrate ({timeRange} Tage)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgCompletionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt-Check-ins</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCheckIns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zeitraum</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex space-x-1">
              {(['7', '30', '90'] as const).map(range => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Selector and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gewohnheit auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeHabits.map(habit => (
                <button
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedHabit?.id === habit.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div>
                      <div className="font-medium">{habit.name}</div>
                      {habit.category && (
                        <div className="text-sm text-muted-foreground">{habit.category}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedHabit && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedHabit.name} - Details</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedHabit.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedHabit.type === 'quantitative' ? 'Quantitativ' : 'Binär'}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Habit Insight Card */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  {habitInsight}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getCurrentStreak(selectedHabit.id)}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktuelle Serie</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getLongestStreak(selectedHabit.id)}
                  </div>
                  <div className="text-sm text-muted-foreground">Längste Serie</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getCompletionRate(selectedHabit.id, 7)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Letzte 7 Tage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {getCompletionRate(selectedHabit.id, 30)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Letzte 30 Tage</div>
                </div>
              </div>

              {/* Quantitative Stats */}
              {selectedHabit.type === 'quantitative' && habitStats?.quantitativeStats && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Quantitative Details</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {habitStats.quantitativeStats.averageValue}
                      </div>
                      <div className="text-xs text-muted-foreground">Ø Wert</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {habitStats.quantitativeStats.bestValue}
                      </div>
                      <div className="text-xs text-muted-foreground">Bester Wert</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {habitStats.quantitativeStats.totalValue}
                      </div>
                      <div className="text-xs text-muted-foreground">Gesamt</div>
                    </div>
                  </div>
                  {selectedHabit.frequency.targetValue && (
                    <div className="mt-2 text-center">
                      <span className="text-sm text-blue-700">
                        Ziel: {selectedHabit.frequency.targetValue} • 
                        Erreicht: {Math.round((habitStats.quantitativeStats.averageValue / selectedHabit.frequency.targetValue) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Trend Chart */}
              <div className="mb-6">
                <h4 className="font-medium mb-4">Verlauf der letzten {timeRange} Tage</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(value) => value === 1 ? '✓' : '✗'} />
                    <Tooltip 
                      formatter={(value: any) => value === 1 ? 'Erledigt' : 'Nicht erledigt'}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="completed" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Wochenübersicht</CardTitle>
          <CardDescription>
            Deine Leistung in den letzten 8 Wochen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'completed') return [`${value} erledigt`, 'Erledigt']
                    if (name === 'planned') return [`${value} geplant`, 'Geplant']
                    return [value, String(name)]
                  }}
                  labelFormatter={(label) => `Woche ${label}`}
                />
                <Bar dataKey="completed" fill="#22c55e" name="completed" />
                <Bar dataKey="planned" fill="#3b82f6" name="planned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Weekly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weeklyData.slice(0, 3).map((week) => (
              <div key={week.week} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Woche {week.week}</span>
                  <span className="text-sm text-muted-foreground">
                    {week.completionRate}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {week.completed} von {week.planned} geplanten Einheiten geschafft
                </div>
                {week.skipped > 0 && (
                  <div className="text-xs text-orange-600 mt-1">
                    {week.skipped} übersprungen
                  </div>
                )}
                {week.missed > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    {week.missed} verpasst
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compact Heatmap */}
      {selectedHabit && (
        <Card>
          <CardHeader>
            <CardTitle>Jahres-Heatmap</CardTitle>
            <CardDescription>
              Aktivität für {selectedHabit.name} im letzten Jahr
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid grid-cols-54 gap-1 text-xs mb-2">
                  <div className="col-span-1"></div>
                  {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-muted-foreground w-3 h-3 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-54 gap-1">
                  {Array.from({ length: 53 }, (_, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                      <div className="text-xs text-muted-foreground w-3 h-3 flex items-center justify-center">
                        {weekIndex % 4 === 0 ? format(new Date(new Date().setDate(new Date().getDate() - (52 - weekIndex) * 7)), 'MMM') : ''}
                      </div>
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const dayData = heatmapData[weekIndex * 7 + dayIndex]
                        const intensity = dayData?.value || 0
                        
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`w-3 h-3 rounded-sm border transition-colors ${
                              intensity === 0 ? 'bg-muted/30 border-muted/50' :
                              intensity === 0.5 ? 'bg-yellow-300/60 border-yellow-400/40' :
                              'bg-green-500/80 border-green-600/60'
                            }`}
                            title={`${dayData?.date || ''}: ${
                              intensity === 0 ? 'Kein Eintrag' :
                              intensity === 0.5 ? 'Übersprungen' :
                              'Erledigt'
                            }`}
                          />
                        )
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted/30 rounded-sm border-muted/50 border"></div>
                <span>Kein Eintrag</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-300/60 rounded-sm border-yellow-400/40 border"></div>
                <span>Übersprungen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500/80 rounded-sm border-green-600/60 border"></div>
                <span>Erledigt</span>
              </div>
            </div>
            
            <div className="text-center mt-4 text-xs text-muted-foreground">
              Letzte 365 Tage • {heatmapData.filter(d => d.value > 0).length} aktive Tage
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Statistics
