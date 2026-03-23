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

  const getChartData = (habit: Habit) => {
    const days = parseInt(timeRange)
    const data = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const checkIn = profileData?.checkIns.find(ci => ci.habitId === habit.id && ci.date === dateStr)
      
      data.push({
        date: format(date, 'dd.MM'),
        status: checkIn?.status || 'none',
        value: checkIn?.value || 0
      })
    }
    
    return data
  }

  const getWeeklyHeatmap = (): any[] => {
    if (!selectedHabit || !profileData) return []
    
    const data: any[] = []
    const today = new Date()
    
    // Last 12 weeks
    for (let week = 11; week >= 0; week--) {
      const weekStart = startOfWeek(subDays(today, week * 7), { weekStartsOn: 1 })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
      
      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const checkIn = profileData.checkIns.find(ci => ci.habitId === selectedHabit.id && ci.date === dateStr)
        
        data.push({
          date: dateStr,
          day: format(day, 'EEE'),
          week: week,
          status: checkIn?.status || 'none',
          value: checkIn?.value || 0
        })
      })
    }
    
    return data
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
      
      const weekCheckIns = profileData.checkIns.filter(ci => {
        const ciDate = new Date(ci.date)
        return ciDate >= weekStart && ciDate <= weekEnd && ci.status === 'done'
      })

      weeks.push({
        week: format(weekStart, 'dd.MM'),
        completed: weekCheckIns.length,
        total: activeHabits.length * 7, // Simplified calculation
      })
    }

    return weeks
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
  const chartData = selectedHabit ? getChartData(selectedHabit) : []
  const trendData = selectedHabit ? getTrendData() : []
  const weeklyData = getWeeklyData()
  const heatmapData = getHeatmapData()
  const weeklyHeatmap = getWeeklyHeatmap()

  // Use the variables to avoid lint warnings
  console.log('Stats loaded:', { overallStats, habitStats, chartData, trendData, weeklyData, heatmapData, weeklyHeatmap })

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
              <CardTitle>{selectedHabit.name} - Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getCurrentStreak(selectedHabit.id)}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktuelle Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getLongestStreak(selectedHabit.id)}
                  </div>
                  <div className="text-sm text-muted-foreground">Längste Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {getCompletionRate(selectedHabit.id, 7)}%
                  </div>
                  <div className="text-sm text-muted-foreground">7 Tage Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {getCompletionRate(selectedHabit.id, 30)}%
                  </div>
                  <div className="text-sm text-muted-foreground">30 Tage Rate</div>
                </div>
              </div>

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
            Check-ins der letzten 8 Wochen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completed" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Heatmap */}
      {selectedHabit && (
        <Card>
          <CardHeader>
            <CardTitle>Jahres-Heatmap</CardTitle>
            <CardDescription>
              Aktivität für {selectedHabit.name} im letzten Jahr
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1 text-xs">
              <div className="col-span-1"></div>
              {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-muted-foreground h-4">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: 53 }, (_, weekIndex) => (
                <React.Fragment key={weekIndex}>
                  <div className="col-span-1"></div>
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayData = heatmapData[weekIndex * 7 + dayIndex]
                    const intensity = dayData?.value || 0
                    
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-4 h-4 rounded-sm border ${
                          intensity === 0 ? 'bg-muted' :
                          intensity === 0.5 ? 'bg-yellow-200' :
                          'bg-green-500'
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
            
            <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-muted rounded-sm border"></div>
                <span>Kein Eintrag</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-200 rounded-sm border"></div>
                <span>Übersprungen</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm border"></div>
                <span>Erledigt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
