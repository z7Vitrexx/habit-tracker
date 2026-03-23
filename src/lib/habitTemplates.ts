import type { FrequencyType } from '../types'

export interface HabitTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  type: 'binary' | 'quantitative'
  frequency: {
    type: FrequencyType
    weekdays?: number[]
    xPerWeek?: number
    targetValue?: number
  }
}

export const habitTemplates: HabitTemplate[] = [
  {
    id: 'water',
    name: 'Wasser trinken',
    description: '8 Gläser Wasser am Tag',
    icon: 'droplets',
    color: '#06b6d4',
    category: 'Gesundheit',
    type: 'quantitative',
    frequency: {
      type: 'daily',
      targetValue: 8,
    },
  },
  {
    id: 'reading',
    name: 'Lesen',
    description: 'Mindestens 20 Minuten lesen',
    icon: 'book',
    color: '#8b5cf6',
    category: 'Lernen',
    type: 'binary',
    frequency: {
      type: 'daily',
    },
  },
  {
    id: 'exercise',
    name: 'Bewegung',
    description: 'Spaziergang, Sport oder Dehnung',
    icon: 'dumbbell',
    color: '#10b981',
    category: 'Fitness',
    type: 'binary',
    frequency: {
      type: 'daily',
    },
  },
  {
    id: 'sleep',
    name: 'Früh schlafen',
    description: 'Vor 23:00 Uhr ins Bett',
    icon: 'moon',
    color: '#6366f1',
    category: 'Gesundheit',
    type: 'binary',
    frequency: {
      type: 'daily',
    },
  },
  {
    id: 'meditation',
    name: 'Meditation',
    description: '10 Minuten Ruhe und Achtsamkeit',
    icon: 'brain',
    color: '#f59e0b',
    category: 'Wohlbefinden',
    type: 'binary',
    frequency: {
      type: 'daily',
    },
  },
  {
    id: 'focus',
    name: 'Fokuszeit',
    description: 'Konzentriert an einem Projekt arbeiten',
    icon: 'target',
    color: '#ef4444',
    category: 'Produktivität',
    type: 'binary',
    frequency: {
      type: 'weekdays',
    },
  },
]
