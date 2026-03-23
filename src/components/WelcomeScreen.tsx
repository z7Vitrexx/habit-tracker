import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Plus, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { habitTemplates } from '../lib/habitTemplates'
import { getIcon } from '../lib/iconMapping'
import { useAuth } from '../hooks/useAuth'
import type { Habit } from '../types'
import { format } from 'date-fns'

interface WelcomeScreenProps {
  onCreateCustom: () => void
}

export function WelcomeScreen({ onCreateCustom }: WelcomeScreenProps) {
  const { profileData, saveProfileData } = useAuth()
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  const toggleTemplate = (templateId: string) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev)
      if (next.has(templateId)) {
        next.delete(templateId)
      } else {
        next.add(templateId)
      }
      return next
    })
  }

  const handleQuickStart = async () => {
    if (!profileData || selectedTemplates.size === 0) return
    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const today = format(new Date(), 'yyyy-MM-dd')

      const newHabits: Habit[] = habitTemplates
        .filter(t => selectedTemplates.has(t.id))
        .map(template => ({
          id: crypto.randomUUID(),
          name: template.name,
          description: template.description,
          color: template.color,
          icon: template.icon,
          category: template.category,
          type: template.type,
          frequency: template.frequency,
          startDate: today,
          status: 'active' as const,
          reminderEnabled: false,
          createdAt: now,
          updatedAt: now,
        }))

      await saveProfileData({
        ...profileData,
        habits: [...profileData.habits, ...newHabits],
      })
    } catch (error) {
      console.error('Error creating habits from templates:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Willkommen!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Starte mit einer Vorlage oder erstelle deinen ersten eigenen Habit.
        </p>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Vorlagen</CardTitle>
          <CardDescription>
            Wähle eine oder mehrere Vorlagen, um schnell zu starten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {habitTemplates.map(template => {
              const Icon = getIcon(template.icon)
              const isSelected = selectedTemplates.has(template.id)

              return (
                <button
                  key={template.id}
                  onClick={() => toggleTemplate(template.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: template.color + '20', color: template.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {template.description}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {selectedTemplates.size > 0 && (
            <Button
              onClick={handleQuickStart}
              disabled={isSaving}
              className="w-full mt-4"
            >
              {isSaving ? (
                'Wird erstellt...'
              ) : (
                <>
                  {selectedTemplates.size} {selectedTemplates.size === 1 ? 'Habit' : 'Habits'} erstellen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Custom Habit */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Eigenen Habit erstellen</h3>
              <p className="text-sm text-muted-foreground">
                Name, Frequenz und mehr selbst festlegen.
              </p>
            </div>
            <Button variant="outline" onClick={onCreateCustom}>
              <Plus className="w-4 h-4 mr-2" />
              Erstellen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="text-center text-sm text-muted-foreground space-y-1 pb-4">
        <p>Tipp: Du kannst Habits jederzeit ändern, pausieren oder neue hinzufügen.</p>
      </div>
    </div>
  )
}
