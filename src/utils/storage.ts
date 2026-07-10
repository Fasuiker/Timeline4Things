import type {
  Category,
  TimelineData,
  TimelineDivider,
  TimelineEvent,
  TimelineNote,
} from '@/types/timeline'

const STORAGE_KEY = 'timeline-studio-data'
const LEGACY_KEYS = ['timeline-studio-data', 'timeline4things-data']

function normalizeNotes(notes: TimelineNote[] | undefined): TimelineNote[] {
  if (!Array.isArray(notes)) return []
  return notes
    .filter((n) => n && typeof n.id === 'string')
    .map((n) => ({
      id: n.id,
      date: n.date || new Date().toISOString().slice(0, 10),
      title: n.title || '无标题笔记',
      content: n.content ?? '',
      updatedAt: n.updatedAt || new Date().toISOString(),
    }))
}

function parseTimelineData(raw: string | null | undefined): TimelineData | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as TimelineData
    if (!data || !Array.isArray(data.events)) return null
    return {
      version: data.version ?? 1,
      events: data.events,
      categories: data.categories ?? [],
      dividers: data.dividers ?? [],
      notes: normalizeNotes(data.notes),
    }
  } catch {
    return null
  }
}

function readLocalStorage(): TimelineData | null {
  for (const key of LEGACY_KEYS) {
    const parsed = parseTimelineData(localStorage.getItem(key))
    if (parsed) return parsed
  }
  return null
}

export function loadFromStorage(): TimelineData | null {
  return readLocalStorage()
}

/** Async load: localStorage first, then Electron file backup. */
export async function loadFromStorageAsync(): Promise<TimelineData | null> {
  const local = readLocalStorage()
  if (local) return local

  try {
    const raw = await window.timelineDesktop?.loadData()
    const fromFile = parseTimelineData(raw)
    if (fromFile) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fromFile))
      return fromFile
    }
  } catch {
    /* ignore */
  }
  return null
}

export function saveToStorage(data: TimelineData) {
  const payload: TimelineData = {
    version: data.version ?? 1,
    events: data.events,
    categories: data.categories,
    dividers: data.dividers ?? [],
    notes: normalizeNotes(data.notes),
  }
  const json = JSON.stringify(payload)
  localStorage.setItem(STORAGE_KEY, json)
  void window.timelineDesktop?.saveData(JSON.stringify(payload, null, 2)).catch(() => {})
}

export function exportToJson(
  events: TimelineEvent[],
  categories: Category[],
  dividers: TimelineDivider[],
  notes: TimelineNote[] = [],
): string {
  const data: TimelineData = {
    version: 1,
    events,
    categories,
    dividers,
    notes: normalizeNotes(notes),
  }
  return JSON.stringify(data, null, 2)
}

export function importFromJson(json: string): TimelineData {
  const data = parseTimelineData(json)
  if (!data) throw new Error('Invalid format: missing events array')
  return data
}
