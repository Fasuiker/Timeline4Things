import type { Category, TimelineData, TimelineDivider, TimelineEvent } from '@/types/timeline'

const STORAGE_KEY = 'timeline-studio-data'

export function loadFromStorage(): TimelineData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimelineData
  } catch {
    return null
  }
}

export function saveToStorage(data: TimelineData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportToJson(
  events: TimelineEvent[],
  categories: Category[],
  dividers: TimelineDivider[],
): string {
  const data: TimelineData = { version: 1, events, categories, dividers }
  return JSON.stringify(data, null, 2)
}

export function importFromJson(json: string): TimelineData {
  const data = JSON.parse(json) as TimelineData
  if (!data.events || !Array.isArray(data.events)) {
    throw new Error('Invalid format: missing events array')
  }
  return {
    version: data.version ?? 1,
    events: data.events,
    categories: data.categories ?? [],
    dividers: data.dividers ?? [],
  }
}
