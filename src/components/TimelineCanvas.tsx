import { useEffect, useRef, useCallback } from 'react'
import { DataSet } from 'vis-data'
import { Timeline } from 'vis-timeline/standalone'
import type { TimelineOptions, Timeline as VisTimeline } from 'vis-timeline'
import { useFilteredEvents } from '@/hooks/useFilteredEvents'
import { useTimelineStore } from '@/store/timelineStore'
import type { Category, TimelineDivider, TimelineEvent } from '@/types/timeline'
import { parseDate, panWindowByWheel } from '@/utils/dateScale'
import {
  buildGroupLabel,
  buildPointContent,
  buildPointStyle,
  buildRangeContent,
  buildRangeStyle,
  formatEventDate,
} from '@/utils/eventTemplate'

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
    stack: true,
    margin: { axis: 8, item: { horizontal: 12, vertical: 14 } },
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
        format: { minorLabels: { hour: 'HH:mm' }, majorLabels: { day: 'ddd D MMM' } },
      }
    case 'week':
      return {
        ...base,
        timeAxis: { scale: 'day', step: 1 },
        format: { minorLabels: { day: 'D' }, majorLabels: { weekday: 'ddd MMM D' } },
      }
    case 'month':
      return {
        ...base,
        timeAxis: { scale: 'day', step: 1 },
        format: { minorLabels: { day: 'D' }, majorLabels: { month: 'MMMM YYYY' } },
      }
    case 'quarter':
      return {
        ...base,
        timeAxis: { scale: 'month', step: 1 },
        format: { minorLabels: { month: 'MMM' }, majorLabels: { month: 'YYYY' } },
      }
    case 'year':
      return {
        ...base,
        timeAxis: { scale: 'month', step: 1 },
        format: { minorLabels: { month: 'MMM' }, majorLabels: { year: 'YYYY' } },
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
  const moveEvent = useTimelineStore((s) => s.moveEvent)
  const moveDivider = useTimelineStore((s) => s.moveDivider)

  const laneMode = viewMode === 'lane'

  const handleSelect = useCallback(
    (props: { items: (string | number)[] }) => {
      const id = props.items[0]?.toString() ?? null
      selectEvent(id)
      if (id) {
        const event = useTimelineStore.getState().events.find((e) => e.id === id)
        if (event) openPanel(event)
      }
    },
    [selectEvent, openPanel],
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

  const handleMove = useCallback(
    (item: Record<string, unknown>, callback: (item: Record<string, unknown> | null) => void) => {
      const id = String(item.id)
      const start = item.start as Date
      const end = (item.end ?? item.start) as Date
      moveEvent(id, start, end)
      callback(item)
    },
    [moveEvent],
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

    const items = new DataSet(events.map((e) => eventToVisItem(e, laneMode, categories)))

    const options: TimelineOptions = {
      ...getTimelineOptions(timeScale, canvasHeight),
      start: viewportStart,
      end: viewportEnd,
      onMove: handleMove as unknown as TimelineOptions['onMove'],
    }

    const timeline = laneMode
      ? new Timeline(containerRef.current, items, groups!, options)
      : new Timeline(containerRef.current, items, options)

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

    const currentIds = items.getIds()
    const newIds = events.map((e) => e.id)
    currentIds.forEach((id: string | number) => {
      if (!newIds.includes(String(id))) items.remove(id)
    })
    events.forEach((event) => {
      const visItem = eventToVisItem(event, laneMode, categories)
      if (items.get(event.id)) items.update(visItem)
      else items.add(visItem)
    })
  }, [events, laneMode, categories])

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
      if (e.ctrlKey) return

      const target = e.target as HTMLElement
      if (target.closest('.vis-timeline')) return

      e.preventDefault()

      const { viewportStart, viewportEnd, setViewport } = useTimelineStore.getState()
      const next = panWindowByWheel(viewportStart, viewportEnd, e)
      viewportSourceRef.current = 'external'
      setViewport(next.start, next.end)
    }

    wrap.addEventListener('wheel', onWheel, { passive: false })
    return () => wrap.removeEventListener('wheel', onWheel)
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
