import { useMemo } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import type { TimelineEvent, TimelineFilters } from '@/types/timeline'

export function filterEvents(
  events: TimelineEvent[],
  searchQuery: string,
  filters: TimelineFilters,
): TimelineEvent[] {
  const q = searchQuery.toLowerCase().trim()
  return events.filter((e) => {
    if (q) {
      const inTitle = e.title.toLowerCase().includes(q)
      const inDesc = e.description?.toLowerCase().includes(q)
      const inTags = e.tags?.some((t) => t.toLowerCase().includes(q))
      if (!inTitle && !inDesc && !inTags) return false
    }
    if (filters.categories.length > 0 && !filters.categories.includes(e.category)) {
      return false
    }
    if (filters.importance.length > 0 && !filters.importance.includes(e.importance)) {
      return false
    }
    if (filters.tags.length > 0) {
      const eventTags = e.tags ?? []
      if (!filters.tags.some((t) => eventTags.includes(t))) return false
    }
    return true
  })
}

export function useFilteredEvents() {
  const events = useTimelineStore((s) => s.events)
  const searchQuery = useTimelineStore((s) => s.searchQuery)
  const filters = useTimelineStore((s) => s.filters)
  return useMemo(
    () => filterEvents(events, searchQuery, filters),
    [events, searchQuery, filters],
  )
}

export function useAllTags() {
  const events = useTimelineStore((s) => s.events)
  return useMemo(() => {
    const tags = new Set<string>()
    events.forEach((e) => e.tags?.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [events])
}
