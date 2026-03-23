import { z } from 'zod'

// Core Types
export type HabitType = 'binary' | 'quantitative'
export type HabitStatus = 'active' | 'paused' | 'archived'
export type CheckInStatus = 'done' | 'missed' | 'skipped' | 'not_scheduled'
export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'custom' | 'x_per_week'

// Frequency Configuration
export const FrequencyConfigSchema = z.object({
  type: z.enum(['daily', 'weekdays', 'weekends', 'custom', 'x_per_week']),
  weekdays: z.array(z.number()).min(1).max(7).optional(),
  xPerWeek: z.number().min(1).max(7).optional(),
  targetValue: z.number().optional(),
})

export type FrequencyConfig = z.infer<typeof FrequencyConfigSchema>

// Habit Schema
export const HabitSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string(),
  status: z.enum(['active', 'paused', 'archived']),
  type: z.enum(['binary', 'quantitative']),
  frequency: FrequencyConfigSchema,
  reminderEnabled: z.boolean().default(false),
  reminderTime: z.string().optional(), // HH:MM format
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Habit = z.infer<typeof HabitSchema>

// CheckIn Schema
export const CheckInSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  status: z.enum(['done', 'missed', 'skipped', 'not_scheduled']),
  value: z.number().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CheckIn = z.infer<typeof CheckInSchema>

// Category Schema
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  color: z.string(),
  createdAt: z.string(),
})

export type Category = z.infer<typeof CategorySchema>

// Profile Metadata (unencrypted)
export const ProfileMetadataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  avatarColor: z.string(),
  encryptedData: z.string(), // Base64 encrypted profile data
  salt: z.string(), // Base64 salt for key derivation
  iv: z.string(), // Base64 initialization vector
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ProfileMetadata = z.infer<typeof ProfileMetadataSchema>

// Encrypted Profile Data
export const ProfileDataSchema = z.object({
  habits: z.array(HabitSchema),
  checkIns: z.array(CheckInSchema),
  categories: z.array(CategorySchema),
  settings: z.object({
    weekStart: z.enum(['monday', 'sunday']),
    theme: z.enum(['light', 'dark', 'system']),
    autoLockMinutes: z.number().min(0).max(120),
    notifications: z.boolean(),
  }),
  reminders: z.array(z.object({
    id: z.string(),
    habitId: z.string(),
    time: z.string(), // HH:MM format
    enabled: z.boolean(),
  })),
})

export type ProfileData = z.infer<typeof ProfileDataSchema>

// Export/Import Types
export const ExportDataSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  profile: z.object({
    name: z.string().min(1),
    createdAt: z.string(),
  }),
  data: ProfileDataSchema,
})

export type ExportData = z.infer<typeof ExportDataSchema>

// App State
export interface AppState {
  currentProfile: ProfileMetadata | null
  isUnlocked: boolean
  profileData: ProfileData | null
  profiles: ProfileMetadata[]
}

// Statistics Types
export interface StreakInfo {
  current: number
  longest: number
}

export interface CompletionRate {
  days7: number
  days30: number
  days90: number
}

export interface WeekConsistency {
  week: string
  completed: number
  total: number
  rate: number
}

export interface HabitStats {
  habitId: string
  streakInfo: StreakInfo
  completionRate: CompletionRate
  weekConsistency: WeekConsistency[]
  totalCompletions: number
  bestWeek: WeekConsistency | null
}
