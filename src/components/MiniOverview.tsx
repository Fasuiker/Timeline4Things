import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useFilteredEvents } from '@/hooks/useFilteredEvents'
import { useTimelineStore } from '@/store/timelineStore'
import type { TimelineDivider, TimelineEvent } from '@/types/timeline'
import { getOverviewTicks, getOverviewYearBands } from '@/utils/overviewTicks'

function getTimelineRange(events: TimelineEvent[], dividers: TimelineDivider[]) {
  if (events.length === 0 && dividers.length === 0) {
    const now = Date.now()
    return { min: now - 86400000 * 30, max: now + 86400000 * 30 }
  }
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
  const padding = (max - min) * 0.05 || 86400000 * 7
  return { min: min - padding, max: max + padding }
}

export function MiniOverview() {
  const events = useFilteredEvents()
  const dividers = useTimelineStore((s) => s.dividers)
  const viewportStart = useTimelineStore((s) => s.viewportStart)
  const viewportEnd = useTimelineStore((s) => s.viewportEnd)
  const setViewport = useTimelineStore((s) => s.setViewport)
  const categories = useTimelineStore((s) => s.categories)

  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const range = useMemo(() => getTimelineRange(events, dividers), [events, dividers])
  const totalSpan = range.max - range.min
  const toPercent = (time: number) => ((time - range.min) / totalSpan) * 100
  const viewLeft = toPercent(viewportStart.getTime())
  const viewWidth = toPercent(viewportEnd.getTime()) - viewLeft

  const ticks = useMemo(() => getOverviewTicks(range.min, range.max), [range.min, range.max])
  const yearBands = useMemo(
    () => (ticks[0]?.kind === 'month' ? getOverviewYearBands(range.min, range.max) : []),
    [ticks, range.min, range.max],
  )

  const labelStep = useMemo(() => {
    if (ticks.length <= 14) return 1
    if (ticks.length <= 28) return 2
    return Math.ceil(ticks.length / 14)
  }, [ticks.length])

  const getCategoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? '#94a3b8'

  const moveViewport = (clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const viewDuration = viewportEnd.getTime() - viewportStart.getTime()
    const center = range.min + ratio * totalSpan
    setViewport(new Date(center - viewDuration / 2), new Date(center + viewDuration / 2))
  }

  const viewportLabel = `${format(viewportStart, 'yyyy年M月d日', { locale: zhCN })} – ${format(viewportEnd, 'yyyy年M月d日', { locale: zhCN })}`

  return (
    <div className="border-t border-slate-200/60 bg-slate-50/50 px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">导航</span>
        <span className="text-[10px] font-medium text-slate-500">{viewportLabel}</span>
        <span className="text-[10px] text-slate-400">拖动定位</span>
      </div>

      {yearBands.length > 0 && (
        <div className="relative mb-1 h-4">
          {yearBands.map((y) => (
            <span
              key={y.time}
              className="absolute -translate-x-1/2 text-[10px] font-semibold text-slate-500"
              style={{ left: `${toPercent(y.time)}%` }}
            >
              {y.label}
            </span>
          ))}
        </div>
      )}

      <div
        ref={trackRef}
        className="relative h-9 cursor-pointer rounded-lg bg-white/60 ring-1 ring-slate-200/80"
        onPointerDown={(e) => {
          setDragging(true)
          trackRef.current?.setPointerCapture(e.pointerId)
          moveViewport(e.clientX)
        }}
        onPointerMove={(e) => {
          if (dragging) moveViewport(e.clientX)
        }}
        onPointerUp={() => setDragging(false)}
      >
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-slate-200" />

        {ticks.map((tick) => (
          <div
            key={tick.time}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2"
            style={{ left: `${toPercent(tick.time)}%` }}
          >
            <div
              className={tick.kind === 'year' ? 'h-3 w-px bg-slate-400' : 'h-2 w-px bg-slate-300'}
            />
          </div>
        ))}

        {dividers.map((d) => (
          <div
            key={d.id}
            className="pointer-events-none absolute top-0 bottom-0 w-px opacity-70"
            style={{ left: `${toPercent(new Date(d.date).getTime())}%`, backgroundColor: d.color ?? '#ef4444' }}
            title={d.title}
          />
        ))}

        {events.map((e) => {
          const start = e.type === 'point' ? new Date(e.date).getTime() : new Date(e.startDate).getTime()
          const end = e.type === 'point' ? new Date(e.date).getTime() : new Date(e.endDate).getTime()
          const left = toPercent(start)
          const width = Math.max(0.6, toPercent(end) - left)
          return (
            <div
              key={e.id}
              className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full opacity-80"
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: getCategoryColor(e.category) }}
            />
          )
        })}

        <div
          className="absolute top-0.5 bottom-0.5 rounded-md border-2 border-blue-400/70 bg-blue-500/10 shadow-sm"
          style={{ left: `${viewLeft}%`, width: `${viewWidth}%` }}
        />
      </div>

      <div className="relative mt-1 h-4">
        {ticks.map((tick, i) =>
          i % labelStep === 0 ? (
            <span
              key={tick.time}
              className="absolute -translate-x-1/2 text-[9px] text-slate-400"
              style={{ left: `${toPercent(tick.time)}%` }}
            >
              {tick.label}
            </span>
          ) : null,
        )}
      </div>
    </div>
  )
}
