import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import { subscribeWithSelector } from 'zustand/middleware'
import { createSampleDividers } from '@/data/sampleDividers'
import { createSampleEvents, defaultCategories } from '@/data/sampleEvents'
import type {
  Category,
  EventType,
  Importance,
  TimelineDivider,
  TimelineEvent,
  TimelineFilters,
  TimeScale,
  ViewMode,
} from '@/types/timeline'
import { getWindowForScale } from '@/utils/dateScale'
import { filterEvents } from '@/hooks/useFilteredEvents'
import { exportToJson, importFromJson, loadFromStorage, saveToStorage } from '@/utils/storage'

function generateId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function normalizeDividers(dividers: TimelineDivider[]): TimelineDivider[] {
  return dividers.map((d) => {
    const id =
      d.id && /^div_/.test(d.id) ? d.id : generateId('div')
    return { ...d, id, title: d.title || '分界线' }
  })
}

function initState() {
  const stored = loadFromStorage()
  if (stored && Array.isArray(stored.events)) {
    return {
      events: stored.events.filter(
        (e) => e && typeof e.id === 'string' && typeof e.title === 'string',
      ),
      categories: stored.categories?.length > 0 ? stored.categories : defaultCategories,
      dividers: normalizeDividers(stored.dividers ?? createSampleDividers()),
    }
  }
  return {
    events: createSampleEvents(),
    categories: defaultCategories,
    dividers: createSampleDividers(),
  }
}

type PanelKind = 'event' | 'divider'

interface TimelineState {
  events: TimelineEvent[]
  categories: Category[]
  dividers: TimelineDivider[]
  selectedEventId: string | null
  selectedDividerId: string | null
  timeScale: TimeScale
  viewMode: ViewMode
  searchQuery: string
  filters: TimelineFilters
  panelOpen: boolean
  panelKind: PanelKind
  draftEvent: TimelineEvent | null
  draftDivider: TimelineDivider | null
  viewportStart: Date
  viewportEnd: Date

  setTimeScale: (scale: TimeScale) => void
  setViewMode: (mode: ViewMode) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<TimelineFilters>) => void
  toggleFilterCategory: (category: string) => void
  toggleFilterImportance: (importance: Importance) => void
  toggleFilterTag: (tag: string) => void
  selectEvent: (id: string | null) => void
  selectDivider: (id: string | null) => void
  openPanel: (event?: TimelineEvent, defaultType?: EventType) => void
  openDividerPanel: (divider?: TimelineDivider) => void
  closePanel: () => void
  setDraftEvent: (event: TimelineEvent) => void
  setDraftDivider: (divider: TimelineDivider) => void
  saveDraft: () => void
  saveDivider: () => void
  deleteEvent: (id: string) => void
  deleteDivider: (id: string) => void
  moveEvent: (id: string, start: Date, end: Date) => void
  moveDivider: (id: string, date: Date) => void
  setViewport: (start: Date, end: Date) => void
  goToToday: () => void
  fitAll: () => void
  zoom: (factor: number) => void
  exportData: () => string
  importData: (json: string) => void
  getFilteredEvents: () => TimelineEvent[]
  getAllTags: () => string[]
}

const initial = initState()
const initialWindow = getWindowForScale('month')

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    events: initial.events,
    categories: initial.categories,
    dividers: initial.dividers,
    selectedEventId: null,
    selectedDividerId: null,
    timeScale: 'month',
    viewMode: 'compact',
    searchQuery: '',
    filters: { categories: [], importance: [], tags: [] },
    panelOpen: false,
    panelKind: 'event',
    draftEvent: null,
    draftDivider: null,
    viewportStart: initialWindow.start,
    viewportEnd: initialWindow.end,

    setTimeScale: (scale) => {
      const window = getWindowForScale(scale)
      set({ timeScale: scale, viewportStart: window.start, viewportEnd: window.end })
    },

    setViewMode: (mode) => set({ viewMode: mode }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),

    toggleFilterCategory: (category) =>
      set((s) => {
        const cats = s.filters.categories
        return {
          filters: {
            ...s.filters,
            categories: cats.includes(category)
              ? cats.filter((c) => c !== category)
              : [...cats, category],
          },
        }
      }),

    toggleFilterImportance: (importance) =>
      set((s) => {
        const imp = s.filters.importance
        return {
          filters: {
            ...s.filters,
            importance: imp.includes(importance)
              ? imp.filter((i) => i !== importance)
              : [...imp, importance],
          },
        }
      }),

    toggleFilterTag: (tag) =>
      set((s) => {
        const tags = s.filters.tags
        return {
          filters: {
            ...s.filters,
            tags: tags.includes(tag)
              ? tags.filter((t) => t !== tag)
              : [...tags, tag],
          },
        }
      }),

    selectEvent: (id) => set({ selectedEventId: id, selectedDividerId: null }),
    selectDivider: (id) => set({ selectedDividerId: id, selectedEventId: null }),

    openPanel: (event, defaultType = 'point') => {
      if (event) {
        set({
          panelOpen: true,
          panelKind: 'event',
          draftEvent: { ...event },
          draftDivider: null,
          selectedEventId: event.id,
          selectedDividerId: null,
        })
      } else {
        const today = new Date().toISOString().slice(0, 10)
        const base = {
          id: generateId(),
          title: defaultType === 'range' ? '新条事件' : '新点事件',
          importance: 'medium' as const,
          category: 'Work',
          tags: [] as string[],
          description: '',
        }
        const newEvent: TimelineEvent =
          defaultType === 'range'
            ? { ...base, type: 'range', startDate: today, endDate: today }
            : { ...base, type: 'point', date: today }
        set({
          panelOpen: true,
          panelKind: 'event',
          draftEvent: newEvent,
          draftDivider: null,
          selectedEventId: null,
          selectedDividerId: null,
        })
      }
    },

    openDividerPanel: (divider) => {
      if (divider) {
        set({
          panelOpen: true,
          panelKind: 'divider',
          draftDivider: { ...divider },
          draftEvent: null,
          selectedDividerId: divider.id,
          selectedEventId: null,
        })
      } else {
        const today = new Date().toISOString().slice(0, 10)
        set({
          panelOpen: true,
          panelKind: 'divider',
          draftDivider: {
            id: generateId('div'),
            title: '新分界线',
            date: today,
            color: '#dc2626',
          },
          draftEvent: null,
          selectedDividerId: null,
          selectedEventId: null,
        })
      }
    },

    closePanel: () =>
      set({
        panelOpen: false,
        draftEvent: null,
        draftDivider: null,
      }),

    setDraftEvent: (event) => set({ draftEvent: event }),
    setDraftDivider: (divider) => set({ draftDivider: divider }),

    saveDraft: () => {
      const { draftEvent, events } = get()
      if (!draftEvent) return
      const exists = events.some((e) => e.id === draftEvent.id)
      if (exists) {
        set({
          events: events.map((e) => (e.id === draftEvent.id ? draftEvent : e)),
          selectedEventId: draftEvent.id,
        })
      } else {
        set({
          events: [...events, draftEvent],
          selectedEventId: draftEvent.id,
        })
      }
    },

    saveDivider: () => {
      const { draftDivider, dividers } = get()
      if (!draftDivider) return
      const exists = dividers.some((d) => d.id === draftDivider.id)
      if (exists) {
        set({
          dividers: dividers.map((d) => (d.id === draftDivider.id ? draftDivider : d)),
          selectedDividerId: draftDivider.id,
        })
      } else {
        set({
          dividers: [...dividers, draftDivider],
          selectedDividerId: draftDivider.id,
        })
      }
    },

    deleteEvent: (id) => {
      set((s) => ({
        events: s.events.filter((e) => e.id !== id),
        selectedEventId: s.selectedEventId === id ? null : s.selectedEventId,
        panelOpen: s.panelKind === 'event' && s.selectedEventId === id ? false : s.panelOpen,
        draftEvent: s.panelKind === 'event' && s.selectedEventId === id ? null : s.draftEvent,
      }))
    },

    deleteDivider: (id) => {
      set((s) => ({
        dividers: s.dividers.filter((d) => d.id !== id),
        selectedDividerId: s.selectedDividerId === id ? null : s.selectedDividerId,
        panelOpen: s.panelKind === 'divider' && s.selectedDividerId === id ? false : s.panelOpen,
        draftDivider:
          s.panelKind === 'divider' && s.selectedDividerId === id ? null : s.draftDivider,
      }))
    },

    moveEvent: (id, start, end) => {
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)
      set((s) => ({
        events: s.events.map((e) => {
          if (e.id !== id) return e
          if (e.type === 'point') return { ...e, date: startStr }
          const [lo, hi] = startStr <= endStr ? [startStr, endStr] : [endStr, startStr]
          return { ...e, startDate: lo, endDate: hi }
        }),
      }))
    },

    moveDivider: (id, date) => {
      const dateStr = date.toISOString().slice(0, 10)
      set((s) => ({
        dividers: s.dividers.map((d) => (d.id === id ? { ...d, date: dateStr } : d)),
      }))
    },

    setViewport: (start, end) =>
      set((s) => {
        if (
          s.viewportStart.getTime() === start.getTime() &&
          s.viewportEnd.getTime() === end.getTime()
        ) {
          return s
        }
        return { viewportStart: start, viewportEnd: end }
      }),

    goToToday: () => {
      const { timeScale } = get()
      const window = getWindowForScale(timeScale)
      set({ viewportStart: window.start, viewportEnd: window.end })
    },

    fitAll: () => {
      const events = get().getFilteredEvents()
      const { dividers } = get()
      if (events.length === 0 && dividers.length === 0) return
      let min = Infinity
      let max = -Infinity
      for (const e of events) {
        if (e.type === 'point') {
          const t = new Date(e.date).getTime()
          min = Math.min(min, t)
          max = Math.max(max, t)
        } else {
          min = Math.min(min, new Date(e.startDate).getTime())
          max = Math.max(max, new Date(e.endDate).getTime())
        }
      }
      for (const d of dividers) {
        const t = new Date(d.date).getTime()
        min = Math.min(min, t)
        max = Math.max(max, t)
      }
      const padding = (max - min) * 0.1 || 86400000 * 7
      set({
        viewportStart: new Date(min - padding),
        viewportEnd: new Date(max + padding),
      })
    },

    zoom: (factor) => {
      const { viewportStart, viewportEnd } = get()
      const duration = viewportEnd.getTime() - viewportStart.getTime()
      const center = viewportStart.getTime() + duration / 2
      const newDuration = duration * factor
      set({
        viewportStart: new Date(center - newDuration / 2),
        viewportEnd: new Date(center + newDuration / 2),
      })
    },

    exportData: () => {
      const { events, categories, dividers } = get()
      return exportToJson(events, categories, dividers)
    },

    importData: (json) => {
      const data = importFromJson(json)
      set({
        events: data.events,
        categories: data.categories.length > 0 ? data.categories : defaultCategories,
        dividers: normalizeDividers(data.dividers ?? []),
        selectedEventId: null,
        selectedDividerId: null,
        panelOpen: false,
        draftEvent: null,
        draftDivider: null,
      })
    },

    getFilteredEvents: () => {
      const { events, searchQuery, filters } = get()
      return filterEvents(events, searchQuery, filters)
    },

    getAllTags: () => {
      const tags = new Set<string>()
      get().events.forEach((e) => e.tags?.forEach((t) => tags.add(t)))
      return Array.from(tags).sort()
    },
  })),
)

useTimelineStore.subscribe(
  (s) => ({ events: s.events, categories: s.categories, dividers: s.dividers }),
  (data) => saveToStorage({ version: 1, ...data }),
  { equalityFn: shallow },
)
