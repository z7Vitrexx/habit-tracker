import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { Plus, Edit2, Pause, Play, Archive, Trash2, Copy, Target, Calendar, Tag, Bell } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useReminderContext } from '../contexts/ReminderContext'
import type { Habit, HabitStatus, FrequencyType } from '../types'
import { format } from 'date-fns'

const avatarColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

const habitIcons = [
  { name: 'Kein Icon', value: 'none' },
  { name: 'Ziel', value: 'target' },
  { name: 'Kalender', value: 'calendar' },
  { name: 'Tag', value: 'tag' },
]

const weekdays = [
  { id: 1, name: 'Montag' },
  { id: 2, name: 'Dienstag' },
  { id: 3, name: 'Mittwoch' },
  { id: 4, name: 'Donnerstag' },
  { id: 5, name: 'Freitag' },
  { id: 6, name: 'Samstag' },
  { id: 7, name: 'Sonntag' },
]

export function Habits() {
  const { profileData, saveProfileData } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: avatarColors[0],
    icon: '',
    category: '',
    type: 'binary' as 'binary' | 'quantitative',
    frequency: {
      type: 'daily' as FrequencyType,
      weekdays: [1, 2, 3, 4, 5] as number[],
      xPerWeek: 3,
      targetValue: 1,
    },
    startDate: format(new Date(), 'yyyy-MM-dd'),
    reminderTime: '',
    reminderEnabled: false,
  })

  useEffect(() => {
    if (profileData) {
      setHabits(profileData.habits)
    }
  }, [profileData])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: avatarColors[0],
      icon: '',
      category: '',
      type: 'binary' as 'binary' | 'quantitative',
      frequency: {
        type: 'daily' as FrequencyType,
        weekdays: [1, 2, 3, 4, 5] as number[],
        xPerWeek: 3,
        targetValue: 1,
      },
      startDate: format(new Date(), 'yyyy-MM-dd'),
      reminderTime: '',
      reminderEnabled: false,
    })
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name muss mindestens 2 Zeichen lang sein'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name darf maximal 50 Zeichen lang sein'
    }

    // Description validation
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Beschreibung darf maximal 200 Zeichen lang sein'
    }

    // Category validation
    if (formData.category && formData.category.length > 30) {
      newErrors.category = 'Kategorie darf maximal 30 Zeichen lang sein'
    }

    // Frequency validation
    if (formData.frequency.type === 'x_per_week') {
      if (!formData.frequency.xPerWeek || formData.frequency.xPerWeek < 1 || formData.frequency.xPerWeek > 7) {
        newErrors.xPerWeek = 'Anzahl pro Woche muss zwischen 1 und 7 liegen'
      }
    }

    if (formData.frequency.type === 'custom') {
      if (!formData.frequency.weekdays || formData.frequency.weekdays.length === 0) {
        newErrors.weekdays = 'Mindestens ein Wochentag muss ausgewählt sein'
      }
    }

    // Quantitative validation
    if (formData.type === 'quantitative') {
      if (!formData.frequency.targetValue || formData.frequency.targetValue <= 0) {
        newErrors.targetValue = 'Zielwert muss größer als 0 sein'
      }
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Startdatum ist erforderlich'
    } else if (new Date(formData.startDate) > new Date()) {
      newErrors.startDate = 'Startdatum darf nicht in der Zukunft liegen'
    }

    // Reminder validation
    if (formData.reminderEnabled && !formData.reminderTime) {
      newErrors.reminderTime = 'Uhrzeit ist erforderlich, wenn Erinnerungen aktiviert sind'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveHabit = async () => {
    if (!profileData) return

    if (!validateForm()) {
      return
    }

    try {
      const habitData: Habit = {
        id: editingHabit?.id || crypto.randomUUID(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon === 'none' ? undefined : formData.icon,
        category: formData.category.trim() || undefined,
        type: formData.type,
        frequency: formData.frequency,
        startDate: formData.startDate,
        status: 'active',
        reminderEnabled: formData.reminderEnabled,
        reminderTime: formData.reminderEnabled ? formData.reminderTime : undefined,
        createdAt: editingHabit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedHabits = editingHabit
        ? habits.map(h => h.id === editingHabit.id ? habitData : h)
        : [...habits, habitData]

      const updatedProfileData = {
        ...profileData,
        habits: updatedHabits,
      }

      const success = await saveProfileData(updatedProfileData)
      if (success) {
        setIsCreating(false)
        setEditingHabit(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving habit:', error)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!profileData) return

    if (!confirm('Möchtest du diesen Habit wirklich löschen? Alle Check-ins bleiben erhalten.')) {
      return
    }

    try {
      const updatedHabits = habits.filter(h => h.id !== habitId)
      const updatedProfileData = {
        ...profileData,
        habits: updatedHabits,
      }

      await saveProfileData(updatedProfileData)
    } catch (error) {
      console.error('Error deleting habit:', error)
    }
  }

  const handleDuplicateHabit = async (habit: Habit) => {
    if (!profileData) return

    try {
      const duplicatedHabit: Habit = {
        ...habit,
        id: crypto.randomUUID(),
        name: `${habit.name} (Kopie)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updatedHabits = [...habits, duplicatedHabit]
      const updatedProfileData = {
        ...profileData,
        habits: updatedHabits,
      }

      await saveProfileData(updatedProfileData)
    } catch (error) {
      console.error('Error duplicating habit:', error)
    }
  }

  const handleStatusChange = async (habitId: string, newStatus: HabitStatus) => {
    if (!profileData) return

    try {
      const updatedHabits = habits.map(h => 
        h.id === habitId ? { ...h, status: newStatus, updatedAt: new Date().toISOString() } : h
      )

      const updatedProfileData = {
        ...profileData,
        habits: updatedHabits,
      }

      await saveProfileData(updatedProfileData)
    } catch (error) {
      console.error('Error changing habit status:', error)
    }
  }

  const startEdit = (habit: Habit) => {
    setEditingHabit(habit)
    setFormData({
      name: habit.name,
      description: habit.description || '',
      color: habit.color,
      icon: habit.icon || 'none',
      category: habit.category || '',
      type: habit.type,
      frequency: habit.frequency as {
        type: FrequencyType
        weekdays: number[]
        xPerWeek: number
        targetValue: number
      },
      startDate: habit.startDate,
      reminderTime: habit.reminderTime || '',
      reminderEnabled: habit.reminderEnabled || false,
    })
  }

  const getStatusBadge = (status: HabitStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausiert</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archiviert</Badge>
    }
  }

  const getFrequencyText = (frequency: Habit['frequency']) => {
    switch (frequency.type) {
      case 'daily':
        return 'Täglich'
      case 'weekdays':
        return 'Werktags'
      case 'weekends':
        return 'Wochenenden'
      case 'custom':
        return `${frequency.weekdays?.length || 0} Tage/Woche`
      case 'x_per_week':
        return `${frequency.xPerWeek}x pro Woche`
      default:
        return 'Unbekannt'
    }
  }

  const activeHabits = habits.filter(h => h.status === 'active')
  const pausedHabits = habits.filter(h => h.status === 'paused')
  const archivedHabits = habits.filter(h => h.status === 'archived')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground">Verwalte deine Gewohnheiten</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white border shadow-2xl">
            <DialogHeader>
              <DialogTitle>Neuen Habit erstellen</DialogTitle>
              <DialogDescription>
                Fülle die Felder aus, um einen neuen Habit anzulegen.
              </DialogDescription>
            </DialogHeader>
            <HabitForm
              formData={formData}
              errors={errors}
              setFormData={setFormData}
              onSave={handleSaveHabit}
              onCancel={() => {
                setIsCreating(false)
                resetForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {habits.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Erste Gewohnheit erstellen</h3>
                <p className="text-muted-foreground mb-4">
                  Beginne mit dem Tracking deiner ersten Gewohnheit
                </p>
              </div>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Erste Gewohnheit erstellen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Habits */}
      {activeHabits.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Aktive Habits ({activeHabits.length})</h2>
          <div className="grid gap-4">
            {activeHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onEdit={() => startEdit(habit)}
                onDelete={() => handleDeleteHabit(habit.id)}
                onDuplicate={() => handleDuplicateHabit(habit)}
                onStatusChange={(status) => handleStatusChange(habit.id, status)}
                getStatusBadge={getStatusBadge}
                getFrequencyText={getFrequencyText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused Habits */}
      {pausedHabits.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pausierte Habits ({pausedHabits.length})</h2>
          <div className="grid gap-4">
            {pausedHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onEdit={() => startEdit(habit)}
                onDelete={() => handleDeleteHabit(habit.id)}
                onDuplicate={() => handleDuplicateHabit(habit)}
                onStatusChange={(status) => handleStatusChange(habit.id, status)}
                getStatusBadge={getStatusBadge}
                getFrequencyText={getFrequencyText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Archived Habits */}
      {archivedHabits.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Archivierte Habits ({archivedHabits.length})</h2>
          <div className="grid gap-4">
            {archivedHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onEdit={() => startEdit(habit)}
                onDelete={() => handleDeleteHabit(habit.id)}
                onDuplicate={() => handleDuplicateHabit(habit)}
                onStatusChange={(status) => handleStatusChange(habit.id, status)}
                getStatusBadge={getStatusBadge}
                getFrequencyText={getFrequencyText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent className="max-w-2xl bg-white border shadow-2xl">
          <DialogHeader>
            <DialogTitle>Habit bearbeiten</DialogTitle>
            <DialogDescription>
              Passe die Einstellungen dieses Habits an.
            </DialogDescription>
          </DialogHeader>
          <HabitForm
            formData={formData}
            errors={errors}
            setFormData={setFormData}
            onSave={handleSaveHabit}
            onCancel={() => {
              setEditingHabit(null)
              resetForm()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Habit Card Component
function HabitCard({
  habit,
  onEdit,
  onDelete,
  onDuplicate,
  onStatusChange,
  getStatusBadge,
  getFrequencyText,
}: {
  habit: Habit
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onStatusChange: (status: HabitStatus) => void
  getStatusBadge: (status: HabitStatus) => React.ReactNode
  getFrequencyText: (frequency: Habit['frequency']) => string
}) {
  const { testReminderForHabit, getLastReminderInfo } = useReminderContext()

  const handleTestReminder = () => {
    testReminderForHabit(habit.id)
  }

  const lastReminderInfo = getLastReminderInfo(habit.id)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div
              className="w-12 h-12 rounded-xl border-2 border-white shadow-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: habit.color }}
            >
              {habit.icon ? (
                <span className="text-white text-xl">{habit.icon}</span>
              ) : (
                <Target className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-lg">{habit.name}</h3>
                {getStatusBadge(habit.status)}
                {habit.reminderEnabled && habit.reminderTime && (
                  <div className="flex items-center text-sm text-blue-600">
                    <Bell className="w-4 h-4 mr-1" />
                    {habit.reminderTime}
                  </div>
                )}
              </div>
              {habit.description && (
                <p className="text-muted-foreground mb-3">{habit.description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {getFrequencyText(habit.frequency)}
                </span>
                {habit.type === 'quantitative' && (
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Quantitativ
                  </span>
                )}
                {habit.category && (
                  <span className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    {habit.category}
                  </span>
                )}
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Seit {format(new Date(habit.startDate), 'dd.MM.yyyy')}
                </span>
              </div>
              {habit.reminderEnabled && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestReminder}
                      className="text-xs"
                    >
                      <Bell className="w-3 h-3 mr-1" />
                      Erinnerung testen
                    </Button>
                    {lastReminderInfo && (
                      <span className="text-xs text-muted-foreground">
                        Letzte Erinnerung: {lastReminderInfo}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    ℹ️ Lokale Erinnerungen funktionieren zuverlässig, solange die App geöffnet ist.
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {habit.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange('paused')}
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
            {habit.status === 'paused' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange('active')}
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange('archived')}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Habit Form Component
function HabitForm({
  formData,
  errors,
  setFormData,
  onSave,
  onCancel,
}: {
  formData: any
  errors: Record<string, string>
  setFormData: (data: any) => void
  onSave: () => void
  onCancel: () => void
}) {
  const { permission, isSupported, requestPermission } = useReminderContext()
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const handleSave = () => {
    // Simple validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich'
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Startdatum ist erforderlich'
    }
    
    if (Object.keys(newErrors).length > 0) {
      // In a real app, you'd setErrors(newErrors)
      return
    }
    
    onSave()
  }

  const toggleWeekday = (weekdayId: number) => {
    const currentWeekdays = formData.frequency.weekdays || []
    const newWeekdays = currentWeekdays.includes(weekdayId)
      ? currentWeekdays.filter((id: number) => id !== weekdayId)
      : [...currentWeekdays, weekdayId]
    
    setFormData({
      ...formData,
      frequency: { ...formData.frequency, weekdays: newWeekdays }
    })
  }
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="z.B. Morgensport"
            maxLength={50}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Beschreibung</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optionale Beschreibung..."
            rows={3}
            maxLength={200}
            className={errors.description ? 'border-red-500' : ''}
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>
      </div>

      {/* Visual Settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Farbe</label>
          <div className="flex space-x-2">
            {avatarColors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  formData.color === color 
                    ? 'border-gray-800 scale-110 shadow-lg' 
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Icon</label>
          <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Icon auswählen" />
            </SelectTrigger>
            <SelectContent>
              {habitIcons.map(icon => (
                <SelectItem key={icon.value} value={icon.value}>
                  {icon.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Kategorie</label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="z.B. Gesundheit, Arbeit"
            maxLength={30}
            className={errors.category ? 'border-red-500' : ''}
          />
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>
      </div>

      {/* Type and Frequency */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Typ</label>
          <Select value={formData.type} onValueChange={(value: 'binary' | 'quantitative') => setFormData({ ...formData, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binary">Binär (erledigt/nicht erledigt)</SelectItem>
              <SelectItem value="quantitative">Quantitativ (mit Werten)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Frequenz</label>
          <Select 
            value={formData.frequency.type} 
            onValueChange={(value: FrequencyType) => setFormData({ 
              ...formData, 
              frequency: { ...formData.frequency, type: value }
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Täglich</SelectItem>
              <SelectItem value="weekdays">Werktags (Mo-Fr)</SelectItem>
              <SelectItem value="weekends">Wochenenden (Sa-So)</SelectItem>
              <SelectItem value="custom">Benutzerdefinierte Tage</SelectItem>
              <SelectItem value="x_per_week">X-mal pro Woche</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.frequency.type === 'x_per_week' && (
          <div>
            <label className="block text-sm font-medium mb-2">Anzahl pro Woche</label>
            <Input
              type="number"
              min="1"
              max="7"
              value={formData.frequency.xPerWeek}
              onChange={(e) => setFormData({ 
                ...formData, 
                frequency: { ...formData.frequency, xPerWeek: parseInt(e.target.value) || 1 }
              })}
              className={errors.xPerWeek ? 'border-red-500' : ''}
            />
            {errors.xPerWeek && <p className="text-red-500 text-sm mt-1">{errors.xPerWeek}</p>}
          </div>
        )}
        {formData.frequency.type === 'custom' && (
          <div>
            <label className="block text-sm font-medium mb-2">Wochentage auswählen</label>
            <div className="grid grid-cols-4 gap-2">
              {weekdays.map((weekday) => (
                <button
                  key={weekday.id}
                  type="button"
                  onClick={() => toggleWeekday(weekday.id)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    formData.frequency.weekdays?.includes(weekday.id)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {weekday.name.slice(0, 2)}
                </button>
              ))}
            </div>
            {errors.weekdays && <p className="text-red-500 text-sm mt-1">{errors.weekdays}</p>}
          </div>
        )}
        {formData.type === 'quantitative' && (
          <div>
            <label className="block text-sm font-medium mb-2">Zielwert pro Einheit</label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.frequency.targetValue}
              onChange={(e) => setFormData({ 
                ...formData, 
                frequency: { ...formData.frequency, targetValue: parseFloat(e.target.value) || 1 }
              })}
              placeholder="z.B. 5.0 für 5km"
              className={errors.targetValue ? 'border-red-500' : ''}
            />
            {errors.targetValue && <p className="text-red-500 text-sm mt-1">{errors.targetValue}</p>}
          </div>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium mb-2">Startdatum</label>
        <Input
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          max={format(new Date(), 'yyyy-MM-dd')}
          className={errors.startDate ? 'border-red-500' : ''}
        />
        {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
      </div>

      {/* Reminder Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Erinnerungen</h3>
            <p className="text-sm text-muted-foreground">
              Lass dich an diesen Habit erinnern
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {!isSupported && (
              <span className="text-sm text-orange-600">Nicht unterstützt</span>
            )}
            {isSupported && permission === 'denied' && (
              <span className="text-sm text-red-600">Blockiert</span>
            )}
            {isSupported && permission === 'default' && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setIsRequestingPermission(true)
                  await requestPermission()
                  setIsRequestingPermission(false)
                }}
                disabled={isRequestingPermission}
              >
                {isRequestingPermission ? 'Wird angefragt...' : 'Erlauben'}
              </Button>
            )}
            {isSupported && permission === 'granted' && (
              <span className="text-sm text-green-600">Erlaubt</span>
            )}
          </div>
        </div>

        {isSupported && permission === 'granted' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="reminder-enabled"
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="reminder-enabled" className="text-sm font-medium">
                Erinnerung aktivieren
              </label>
            </div>

            {formData.reminderEnabled && (
              <div>
                <label className="block text-sm font-medium mb-2">Uhrzeit</label>
                <Input
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  placeholder="z.B. 08:00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Du wirst täglich zu dieser Uhrzeit an diesen Habit erinnert
                </p>
              </div>
            )}
          </div>
        )}

        {isSupported && permission === 'denied' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              Benachrichtigungen wurden in deinem Browser blockiert. 
              Ändere die Einstellungen in deinem Browser, um Erinnerungen zu aktivieren.
            </p>
          </div>
        )}

        {!isSupported && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-800">
              Dein Browser unterstützt keine Benachrichtigungen. 
              Verwende einen modernen Browser für Erinnerungen.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button onClick={handleSave} className="flex-1">
          Speichern
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
