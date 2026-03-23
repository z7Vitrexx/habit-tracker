import Dexie, { type Table } from 'dexie'
import type { ProfileMetadata } from '../types'

export class HabitTrackerDB extends Dexie {
  profiles!: Table<ProfileMetadata>

  constructor() {
    super('HabitTrackerDB')
    this.version(1).stores({
      profiles: 'id, name, avatarColor, createdAt, updatedAt',
    })
  }
}

export const db = new HabitTrackerDB()
