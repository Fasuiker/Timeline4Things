import { useEffect, useRef, useCallback } from 'react'
import { DataSet } from 'vis-data'
import { Timeline } from 'vis-timeline/standalone'
import type { TimelineOptions, Timeline as VisTimeline } from 'vis-timeline'
import { useFilteredEvents } from '@/hooks/useFilteredEvents'
import { useTimelineStore } from '@/store/timelineStore'
import type { Category, TimelineDivider, TimelineEvent, TimelineNote } from '@/types/timeline'
import { parseDate, panWindowByWheel } from '@/utils/dateScale'
import { addMonths, endOfMonth, startOfMonth } from 'date-fns'
import {
  buildGroupLabel,
  buildPointContent,
  buildPointStyle,
  buildRangeContent,
  buildRangeStyle,
  escapeHtml,
  formatEventDate,
} from '@/utils/eventTemplate'

function isNoteItemId(id: string) {
  return id.startsWith('note_')
}

function isMonthBandId(id: string) {
  return id.startsWith('monthband_')
}

function buildMonthBands(rangeStart: Date, rangeEnd: Date) {
  const start = startOfMonth(addMonths(rangeStart, -1))
  const end = endOfMonth(addMonths(rangeEnd, 1))
  const bands: Record<string, unknown>[] = []
  let cursor = start
  let index = 0

  while (cursor.getTime() <= end.getTime()) {
    const monthEnd = endOfMonth(cursor)
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    bands.push({
      id: `monthband_${y}_${m}`,
      start: cursor,
      end: new Date(monthEnd.getTime() + 1),
      type: 'background',
      className: `tl-month-band ${index % 2 === 0 ? 'tl-month-band--a' : 'tl-month-band--b'}`,
      editable: false,
      selectable: false,
    })
    cursor = addMonths(startOfMonth(cursor), 1)
    index += 1
  }

  return bands
}

function noteToVisItem(note: TimelineNote) {
  const title = note.title || '笔记'
  const preview = (note.content || '').replace(/\s+/g, ' ').trim().slice(0, 80)
  return {
    id: note.id,
    content: `<span class="tl-note-label">${escapeHtml(title)}</span>`,
    className: 'tl-note-event',
    title: [title, note.date, preview].filter(Boolean).join('\n'),
    start: parseDate(note.date),
    type: 'point' as const,
    editable: false,
  }
}

function eventToVisItem(event: TimelineEvent, laneMode: boolean, categories: Category[]) {
  const tooltip = [
    event.title,
    formatEventDate(event),
    event.category,
    event.importance,
    event.description?.slice(0, 100),
  ]
    .filter(Boolean)
    .join('\n')

  if (event.type === 'point') {
    return {
      id: event.id,
      content: buildPointContent(event),
      className: `tl-event tl-point-event importance-${event.importance}`,
      style: buildPointStyle(event, categories),
      title: tooltip,
      start: parseDate(event.date),
      type: 'point' as const,
      ...(laneMode ? { group: event.category } : {}),
    }
  }

  return {
    id: event.id,
    content: buildRangeContent(event),
    className: `tl-event tl-range-event importance-${event.importance}`,
    style: buildRangeStyle(event, categories),
    title: tooltip,
    start: parseDate(event.startDate),
    end: parseDate(event.endDate),
    type: 'range' as const,
    ...(laneMode ? { group: event.category } : {}),
  }
}

function syncDividers(
  timeline: VisTimeline,
  dividers: TimelineDivider[],
  knownIds: Set<string>,
  container?: HTMLElement | null,
) {
  knownIds.forEach((id) => {
    if (!dividers.some((d) => d.id === id)) {
      try {
        timeline.removeCustomTime(id)
      } catch {
        /* already removed */
      }
      knownIds.delete(id)
    }
  })
  dividers.forEach((d) => {
    if (!d.id || !d.date) return
    const time = parseDate(d.date)
    try {
      if (knownIds.has(d.id)) {
        timeline.setCustomTime(time, d.id)
        ;(timeline as VisTimeline & { setCustomTimeMarker: (title: string, id: string) => void }).setCustomTimeMarker(d.title, d.id)
      } else {
        timeline.addCustomTime(time, d.id)
        ;(timeline as VisTimeline & { setCustomTimeMarker: (title: string, id: string) => void }).setCustomTimeMarker(d.title, d.id)
        knownIds.add(d.id)
      }
    } catch (err) {
      console.warn('Failed to sync divider', d.id, err)
    }
  })

  if (container) {
    requestAnimationFrame(() => applyDividerStyles(container, dividers))
  }
}

function applyDividerStyles(container: HTMLElement, dividers: TimelineDivider[]) {
  const scale =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tl-scale')) || 1.5
  container.querySelectorAll('.vis-custom-time').forEach((el) => {
    const htmlEl = el as HTMLElement
    const id = htmlEl.className
      .split(/\s+/)
      .find((c) => c !== 'vis-custom-time' && c.length > 0)
    const divider = dividers.find((d) => d.id === id)
    if (!divider) return
    const color = divider.color ?? '#ef4444'
    htmlEl.style.backgroundColor = color
    const marker = htmlEl.querySelector('.vis-custom-time-marker') as HTMLElement | null
    if (marker) {
      marker.style.backgroundColor = color
      marker.style.color = '#fff'
      marker.style.fontSize = `${11 * scale}px`
      marker.style.fontWeight = '600'
      marker.style.borderRadius = '4px'
      marker.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'
    }
  })
}

function getTimelineOptions(scale: string, height = 400): Partial<TimelineOptions> {
  const base: Partial<TimelineOptions> = {
    height,
    editable: {
      add: false,
      updateTime: true,
      updateGroup: false,
      remove: false,
      overrideItems: false,
    },
    selectable: true,
    multiselect: false,
    // Stack overlapping items vertically. Order is stable by start time.
    stack: true,
    order: (a, b) => {
      const aStart = new Date(a.start as string | Date).getTime()
      const bStart = new Date(b.start as string | Date).getTime()
      if (aStart !== bStart) return aStart - bStart
      return String(a.id).localeCompare(String(b.id))
    },
    // Extra vertical gap so nearby point labels are less likely to collide.
    margin: { axis: 8, item: { horizontal: 12, vertical: 22 } },
    orientation: 'top',
    zoomKey: 'ctrlKey',
    horizontalScroll: true,
    verticalScroll: false,
    showCurrentTime: true,
    showMajorLabels: true,
    showMinorLabels: true,
    zoomMin: 1000 * 60 * 60 * 6,
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 3,
  }

  switch (scale) {
    case 'day':
      return {
        ...base,
        timeAxis: { scale: 'hour', step: 3 },
        format: {
          minorLabels: { hour: 'HH:mm' },
          majorLabels: { day: 'M月D日' },
        },
      }
    case 'week':
      return {
        ...base,
        timeAxis: { scale: 'day', step: 1 },
        format: {
          minorLabels: { day: 'D' },
          majorLabels: { weekday: 'M月D日' },
        },
      }
    case 'month':
      return {
        ...base,
        timeAxis: { scale: 'day', step: 1 },
        format: {
          minorLabels: { day: 'D' },
          majorLabels: { month: 'YYYY年 M月' },
        },
      }
    case 'quarter':
      return {
        ...base,
        timeAxis: { scale: 'month', step: 1 },
        format: {
          minorLabels: { month: 'M月' },
          majorLabels: { month: 'YYYY年' },
        },
      }
    case 'year':
      return {
        ...base,
        timeAxis: { scale: 'month', step: 1 },
        format: {
          minorLabels: { month: 'M月' },
          majorLabels: { year: 'YYYY年' },
        },
      }
    default:
      return base
  }
}

export function TimelineCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<VisTimeline | null>(null)
  const itemsRef = useRef<DataSet<Record<string, unknown>> | null>(null)
  const dividerIdsRef = useRef(new Set<string>())
  const syncingRef = useRef(false)
  const viewportSourceRef = useRef<'timeline' | 'external'>('external')

  const events = useFilteredEvents()
  const notes = useTimelineStore((s) => s.notes)
  const dividers = useTimelineStore((s) => s.dividers)
  const viewMode = useTimelineStore((s) => s.viewMode)
  const timeScale = useTimelineStore((s) => s.timeScale)
  const viewportStart = useTimelineStore((s) => s.viewportStart)
  const viewportEnd = useTimelineStore((s) => s.viewportEnd)
  const categories = useTimelineStore((s) => s.categories)
  const selectedEventId = useTimelineStore((s) => s.selectedEventId)
  const displayScale = useTimelineStore((s) => s.displayScale)
  const selectEvent = useTimelineStore((s) => s.selectEvent)
  const openPanel = useTimelineStore((s) => s.openPanel)
  const openDividerPanel = useTimelineStore((s) => s.openDividerPanel)
  const openNotesPanel = useTimelineStore((s) => s.openNotesPanel)
  const moveEvent = useTimelineStore((s) => s.moveEvent)
  const moveDivider = useTimelineStore((s) => s.moveDivider)

  const laneMode = viewMode === 'lane'

  const handleSelect = useCallback(
    (props: { items: (string | number)[] }) => {
      const id = props.items[0]?.toString() ?? null
      if (!id) {
        selectEvent(null)
        return
      }
      if (isNoteItemId(id)) {
        const note = useTimelineStore.getState().notes.find((n) => n.id === id)
        if (note) openNotesPanel(note)
        return
      }
      selectEvent(id)
      const event = useTimelineStore.getState().events.find((e) => e.id === id)
      if (event) openPanel(event)
    },
    [selectEvent, openPanel, openNotesPanel],
  )

  const handleMove = useCallback(
    (item: Record<string, unknown>, callback: (item: Record<string, unknown> | null) => void) => {
      const id = String(item.id)
      if (isNoteItemId(id) || isMonthBandId(id)) {
        callback(null)
        return
      }
      const start = item.start as Date
      const end = (item.end ?? item.start) as Date
      moveEvent(id, start, end)
      callback(item)
    },
    [moveEvent],
  )

  const handleRangeChange = useCallback(
    (props: { start: Date; end: Date; byUser?: boolean }) => {
      if (syncingRef.current) return
      if (props.byUser === false) return
      viewportSourceRef.current = 'timeline'
      useTimelineStore.getState().setViewport(props.start, props.end)
    },
    [],
  )

  const handleTimeChange = useCallback(
    (props: { id?: string; time?: Date }) => {
      if (props.id && props.time) {
        moveDivider(props.id, props.time)
      }
    },
    [moveDivider],
  )

  useEffect(() => {
    if (!containerRef.current || !wrapRef.current) return

    const canvasHeight = Math.max(220, wrapRef.current.clientHeight)

    const groups = laneMode
      ? new DataSet(categories.map((c) => ({ id: c.name, content: buildGroupLabel(c) })))
      : undefined

    const monthBands = buildMonthBands(viewportStart, viewportEnd)
    const items = new DataSet(
      [
        ...monthBands,
        ...events.map((e) => eventToVisItem(e, laneMode, categories)),
        ...(laneMode ? [] : notes.map((n) => noteToVisItem(n))),
      ] as Record<string, unknown>[],
    )

    const options: TimelineOptions = {
      ...getTimelineOptions(timeScale, canvasHeight),
      start: viewportStart,
      end: viewportEnd,
      onMove: handleMove as unknown as TimelineOptions['onMove'],
    }

    const timeline = laneMode
      ? new Timeline(
          containerRef.current,
          items as unknown as ConstructorParameters<typeof Timeline>[1],
          groups!,
          options,
        )
      : new Timeline(
          containerRef.current,
          items as unknown as ConstructorParameters<typeof Timeline>[1],
          options,
        )

    timeline.on('select', handleSelect)
    timeline.on('rangechange', handleRangeChange)
    timeline.on('rangechanged', handleRangeChange)
    timeline.on('timechange', handleTimeChange)

    timeline.on('doubleClick', (props) => {
      if (!props.item && props.time) {
        const date = props.time.toISOString().slice(0, 10)
        openPanel({
          id: `evt_${Date.now()}`,
          type: 'point',
          title: '新点事件',
          date,
          importance: 'medium',
          category: 'Work',
          tags: [],
        })
      }
    })

    timeline.on('click', (props) => {
      const target = props.event?.target as HTMLElement | null
      if (target?.closest('.vis-custom-time')) {
        const divId = props.customTime
        if (divId) {
          const divider = useTimelineStore.getState().dividers.find((d) => d.id === divId)
          if (divider) openDividerPanel(divider)
        }
      }
    })


    syncDividers(timeline, dividers, dividerIdsRef.current, containerRef.current)

    timelineRef.current = timeline
    itemsRef.current = items

    return () => {
      dividerIdsRef.current.clear()
      timeline.destroy()
      timelineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laneMode, timeScale])

  useEffect(() => {
    const wrap = wrapRef.current
    const timeline = timelineRef.current
    if (!wrap || !timeline) return

    const applyHeight = () => {
      const height = Math.max(220, wrap.clientHeight)
      timeline.setOptions({ height })
      timeline.redraw()
    }

    applyHeight()
    const observer = new ResizeObserver(applyHeight)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [laneMode, timeScale])

  useEffect(() => {
    const timeline = timelineRef.current
    const items = itemsRef.current
    if (!timeline || !items) return

    const monthBands = buildMonthBands(viewportStart, viewportEnd)
    const eventItems = events.map((e) => eventToVisItem(e, laneMode, categories))
    const noteItems = laneMode ? [] : notes.map((n) => noteToVisItem(n))
    const nextItems = [...monthBands, ...eventItems, ...noteItems]
    const newIds = new Set(nextItems.map((item) => String(item.id)))

    items.getIds().forEach((id: string | number) => {
      if (!newIds.has(String(id))) items.remove(id)
    })
    nextItems.forEach((visItem) => {
      if (items.get(visItem.id as string)) items.update(visItem)
      else items.add(visItem)
    })
  }, [events, notes, laneMode, categories, viewportStart, viewportEnd])

  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return
    syncDividers(timeline, dividers, dividerIdsRef.current, containerRef.current)
    timeline.redraw()
  }, [dividers, displayScale])

  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return
    if (viewportSourceRef.current === 'timeline') {
      viewportSourceRef.current = 'external'
      // Still refresh month bands while user pans.
      const items = itemsRef.current
      if (items) {
        const bands = buildMonthBands(viewportStart, viewportEnd)
        const keep = new Set(bands.map((b) => String(b.id)))
        items.getIds().forEach((id: string | number) => {
          if (isMonthBandId(String(id)) && !keep.has(String(id))) items.remove(id)
        })
        bands.forEach((band) => {
          if (items.get(band.id as string)) items.update(band)
          else items.add(band)
        })
      }
      return
    }
    syncingRef.current = true
    timeline.setWindow(viewportStart, viewportEnd, { animation: false })
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }, [viewportStart, viewportEnd])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const onWheel = (e: WheelEvent) => {
      // Ctrl+wheel is reserved for zoom (vis-timeline zoomKey).
      if (e.ctrlKey) return

      e.preventDefault()
      e.stopPropagation()

      const { viewportStart, viewportEnd, setViewport } = useTimelineStore.getState()
      const next = panWindowByWheel(viewportStart, viewportEnd, e)
      viewportSourceRef.current = 'external'
      setViewport(next.start, next.end)
    }

    wrap.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => wrap.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions)
  }, [])

  useEffect(() => {
    const timeline = timelineRef.current
    if (!timeline) return
    if (selectedEventId) timeline.setSelection([selectedEventId])
    else timeline.setSelection([])
  }, [selectedEventId])

  return (
    <div ref={wrapRef} className="timeline-canvas-wrap w-full min-h-0 flex-1">
      <div ref={containerRef} className="timeline-canvas absolute inset-0" />
    </div>
  )
}
