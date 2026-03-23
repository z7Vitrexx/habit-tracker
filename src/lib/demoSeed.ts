import type { ProfileMetadata, ProfileData, Habit, CheckIn, FrequencyType } from '../types'

export interface DemoSeedData {
  profile: ProfileMetadata
  habits: Habit[]
  checkIns: CheckIn[]
}

export function createDemoSeed(): DemoSeedData {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  // Demo Profile
  const profile: ProfileMetadata = {
    id: 'demo-profile',
    name: 'Demo',
    avatarColor: '#3b82f6',
    encryptedData: '', // Will be populated when saving
    salt: '', // Will be populated when saving
    iv: '', // Will be populated when saving
    createdAt: thirtyDaysAgo.toISOString(),
    updatedAt: thirtyDaysAgo.toISOString()
  }

  // Demo Habits
  const habits: Habit[] = [
    {
      id: 'demo-habit-1',
      name: 'Wasser trinken',
      description: 'Mindestens 8 Gläser Wasser pro Tag',
      icon: 'droplets',
      color: '#3b82f6',
      category: 'Gesundheit',
      startDate: thirtyDaysAgo.toISOString(),
      status: 'active',
      type: 'quantitative',
      frequency: {
        type: 'daily' as FrequencyType,
        targetValue: 8
      },
      reminderEnabled: false,
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: thirtyDaysAgo.toISOString()
    },
    {
      id: 'demo-habit-2',
      name: 'Lesen',
      description: 'Jeden Tag mindestens 20 Minuten lesen',
      icon: 'book',
      color: '#8b5cf6',
      category: 'Lernen',
      startDate: thirtyDaysAgo.toISOString(),
      status: 'active',
      type: 'binary',
      frequency: {
        type: 'daily' as FrequencyType
      },
      reminderEnabled: false,
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: thirtyDaysAgo.toISOString()
    },
    {
      id: 'demo-habit-3',
      name: 'Spaziergang',
      description: 'Täglicher Spaziergang von 30 Minuten',
      icon: 'activity',
      color: '#10b981',
      category: 'Bewegung',
      startDate: thirtyDaysAgo.toISOString(),
      status: 'active',
      type: 'binary',
      frequency: {
        type: 'daily' as FrequencyType
      },
      reminderEnabled: false,
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: thirtyDaysAgo.toISOString()
    },
    {
      id: 'demo-habit-4',
      name: 'Meditation',
      description: '3x pro Woche meditieren',
      icon: 'brain',
      color: '#f59e0b',
      category: 'Achtsamkeit',
      startDate: thirtyDaysAgo.toISOString(),
      status: 'active',
      type: 'binary',
      frequency: {
        type: 'x_per_week' as FrequencyType,
        xPerWeek: 3,
        weekdays: [1, 3, 5] // Mon, Wed, Fri
      },
      reminderEnabled: false,
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: thirtyDaysAgo.toISOString()
    },
    {
      id: 'demo-habit-5',
      name: 'Schlaf vor 23 Uhr',
      description: 'Jeden Abend vor 23 Uhr ins Bett',
      icon: 'moon',
      color: '#6366f1',
      category: 'Schlaf',
      startDate: thirtyDaysAgo.toISOString(),
      status: 'active',
      type: 'binary',
      frequency: {
        type: 'daily' as FrequencyType
      },
      reminderEnabled: false,
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: thirtyDaysAgo.toISOString()
    },
    {
      id: 'demo-habit-6',
      name: 'Fokuszeit',
      description: 'An Wochentagen 60 Minuten konzentriert arbeiten',
      icon: 'clock',
      color: '#ef4444',
      category: 'Produktivität',
      startDate: thirtyDaysAgo.toISOString(),
      status: 'active',
      type: 'quantitative',
      frequency: {
        type: 'x_per_week' as FrequencyType,
        xPerWeek: 5,
        weekdays: [1, 2, 3, 4, 5] // Mon-Fri
      },
      reminderEnabled: false,
      createdAt: thirtyDaysAgo.toISOString(),
      updatedAt: thirtyDaysAgo.toISOString()
    }
  ]

  // Generate realistic check-ins for the last 30 days
  const checkIns: CheckIn[] = []
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
    const dayOfWeek = currentDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // Wasser trinken (quantitativ)
    const waterValue = Math.floor(Math.random() * 5) + 6 // 6-10 Gläser
    checkIns.push({
      id: `demo-checkin-water-${i}`,
      habitId: 'demo-habit-1',
      date: dateStr,
      status: waterValue >= 8 ? 'done' : (waterValue >= 6 ? 'done' : 'missed'),
      value: waterValue,
      note: waterValue < 8 && Math.random() > 0.7 ? `Nur ${waterValue} Gläser geschafft.` : undefined,
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    })

    // Lesen (binär)
    const readingDone = Math.random() > 0.3 // 70% success rate
    checkIns.push({
      id: `demo-checkin-reading-${i}`,
      habitId: 'demo-habit-2',
      date: dateStr,
      status: readingDone ? 'done' : 'missed',
      note: readingDone && Math.random() > 0.8 ? 'Abends noch 20 Seiten gelesen.' : undefined,
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    })

    // Spaziergang (binär)
    const walkDone = Math.random() > (isWeekend ? 0.2 : 0.4) // Better on weekends
    checkIns.push({
      id: `demo-checkin-walk-${i}`,
      habitId: 'demo-habit-3',
      date: dateStr,
      status: walkDone ? 'done' : (Math.random() > 0.7 ? 'skipped' : 'missed'),
      note: !walkDone && Math.random() > 0.6 ? (isWeekend ? 'Wochenende, ausgeschlafen.' : 'Heute wegen Regen übersprungen.') : undefined,
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    })

    // Meditation (nur an bestimmten Tagen)
    const shouldMeditate = [1, 3, 5].includes(dayOfWeek) // Mon, Wed, Fri
    if (shouldMeditate) {
      const meditationDone = Math.random() > 0.3
      checkIns.push({
        id: `demo-checkin-meditation-${i}`,
        habitId: 'demo-habit-4',
        date: dateStr,
        status: meditationDone ? 'done' : 'missed',
        note: meditationDone && Math.random() > 0.7 ? '15 Minuten Morgenmeditation.' : undefined,
        createdAt: currentDate.toISOString(),
        updatedAt: currentDate.toISOString()
      })
    }

    // Schlaf vor 23 Uhr (binär)
    const sleepDone = Math.random() > (isWeekend ? 0.6 : 0.4) // Worse on weekends
    checkIns.push({
      id: `demo-checkin-sleep-${i}`,
      habitId: 'demo-habit-5',
      date: dateStr,
      status: sleepDone ? 'done' : 'missed',
      note: !sleepDone && Math.random() > 0.5 ? 'Spät ins Bett, um 23:30 Uhr.' : undefined,
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    })

    // Fokuszeit (nur an Wochentagen)
    if (!isWeekend) {
      const focusValue = Math.floor(Math.random() * 40) + 40 // 40-80 Minuten
      checkIns.push({
        id: `demo-checkin-focus-${i}`,
        habitId: 'demo-habit-6',
        date: dateStr,
        status: focusValue >= 60 ? 'done' : 'done', // Always done, just with different values
        value: focusValue,
        note: focusValue > 70 && Math.random() > 0.6 ? `${focusValue} Minuten konzentriert gearbeitet.` : undefined,
        createdAt: currentDate.toISOString(),
        updatedAt: currentDate.toISOString()
      })
    }
  }

  return {
    profile,
    habits,
    checkIns
  }
}

export function shouldSeedDemo(): boolean {
  // Check if demo mode is enabled
  const demoModeEnabled = import.meta.env.VITE_DEMO_MODE === 'true'
  console.log('Demo mode check:', { demoModeEnabled, envValue: import.meta.env.VITE_DEMO_MODE })
  
  if (!demoModeEnabled) {
    console.log('Demo mode disabled - skipping seed')
    return false
  }

  // Check if there's already data (don't overwrite existing data)
  try {
    const existingData = localStorage.getItem('habit-tracker-data')
    const existingProfiles = localStorage.getItem('habit-tracker-profiles')
    const currentProfile = localStorage.getItem('habit-tracker-current-profile')
    
    console.log('Existing data check:', { 
      hasData: !!existingData, 
      hasProfiles: !!existingProfiles, 
      hasCurrentProfile: !!currentProfile 
    })
    
    // More thorough check - only seed if there's truly no meaningful data
    if (existingData || existingProfiles || currentProfile) {
      console.log('Existing data found - skipping demo seed')
      return false
    }
    
    console.log('No existing data found - proceeding with demo seed')
    return true
  } catch (error) {
    console.warn('Error checking for existing data:', error)
    return false
  }
}

export async function seedDemoData(): Promise<void> {
  console.log('seedDemoData called')
  
  if (!shouldSeedDemo()) {
    console.log('Demo seed conditions not met - exiting')
    return
  }

  try {
    console.log('Creating demo data...')
    const demoData = createDemoSeed()
    
    console.log('Saving demo profile...')
    // Save demo profile
    const profiles = {
      [demoData.profile.id]: demoData.profile
    }
    localStorage.setItem('habit-tracker-profiles', JSON.stringify(profiles))
    
    console.log('Saving demo data with habits and check-ins...')
    // Save demo data
    const data: ProfileData = {
      habits: demoData.habits,
      checkIns: demoData.checkIns,
      categories: [
        { id: 'gesundheit', name: 'Gesundheit', color: '#3b82f6', createdAt: new Date().toISOString() },
        { id: 'lernen', name: 'Lernen', color: '#8b5cf6', createdAt: new Date().toISOString() },
        { id: 'bewegung', name: 'Bewegung', color: '#10b981', createdAt: new Date().toISOString() },
        { id: 'achtsamkeit', name: 'Achtsamkeit', color: '#f59e0b', createdAt: new Date().toISOString() },
        { id: 'schlaf', name: 'Schlaf', color: '#6366f1', createdAt: new Date().toISOString() },
        { id: 'produktivitaet', name: 'Produktivität', color: '#ef4444', createdAt: new Date().toISOString() }
      ],
      settings: {
        weekStart: 'monday',
        theme: 'light',
        autoLockMinutes: 0,
        notifications: true
      },
      reminders: []
    }
    localStorage.setItem('habit-tracker-data', JSON.stringify(data))
    
    console.log('Setting current profile...')
    // Set current profile
    localStorage.setItem('habit-tracker-current-profile', demoData.profile.id)
    
    console.log('✅ Demo data seeded successfully', {
      profileId: demoData.profile.id,
      habitsCount: demoData.habits.length,
      checkInsCount: demoData.checkIns.length
    })
  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
  }
}
