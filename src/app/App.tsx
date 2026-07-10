import { useEffect } from 'react'
import { DividerDetailsPanel } from '@/components/DividerDetailsPanel'
import { EventDetailsPanel } from '@/components/EventDetailsPanel'
import { FilterBar } from '@/components/FilterBar'
import { MiniOverview } from '@/components/MiniOverview'
import { TimelineCanvas } from '@/components/TimelineCanvas'
import { TimelineLegend } from '@/components/TimelineLegend'
import { TimelineToolbar } from '@/components/TimelineToolbar'
import { useTimelineStore } from '@/store/timelineStore'
import { applyDisplayScale } from '@/utils/uiPreferences'

function useKeyboardShortcuts() {
  const openPanel = useTimelineStore((s) => s.openPanel)
  const closePanel = useTimelineStore((s) => s.closePanel)
  const panelOpen = useTimelineStore((s) => s.panelOpen)
  const panelKind = useTimelineStore((s) => s.panelKind)
  const selectedEventId = useTimelineStore((s) => s.selectedEventId)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)
  const saveDraft = useTimelineStore((s) => s.saveDraft)
  const saveDivider = useTimelineStore((s) => s.saveDivider)
  const zoom = useTimelineStore((s) => s.zoom)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key === 'Escape') closePanel()
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault()
          if (panelKind === 'divider') saveDivider()
          else saveDraft()
        }
        return
      }

      switch (e.key) {
        case 'n':
        case 'N':
          openPanel(undefined, 'point')
          break
        case 'Escape':
          closePanel()
          break
        case 'Delete':
        case 'Backspace':
          if (selectedEventId && confirm('删除选中事件？')) deleteEvent(selectedEventId)
          break
        case '+':
        case '=':
          zoom(0.75)
          break
        case '-':
          zoom(1.33)
          break
        case 's':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            if (panelOpen) {
              if (panelKind === 'divider') saveDivider()
              else saveDraft()
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openPanel, closePanel, panelOpen, panelKind, selectedEventId, deleteEvent, saveDraft, saveDivider, zoom])
}

export default function App() {
  useKeyboardShortcuts()
  const displayScale = useTimelineStore((s) => s.displayScale)
  const hydrateFromDisk = useTimelineStore((s) => s.hydrateFromDisk)

  useEffect(() => {
    void hydrateFromDisk()
  }, [hydrateFromDisk])

  useEffect(() => {
    applyDisplayScale(displayScale)
  }, [displayScale])

  return (
    <div className="app-shell">
      <div className="app-glow app-glow--left" />
      <div className="app-glow app-glow--right" />

      <TimelineToolbar />
      <FilterBar />

      <main className="app-main">
        <div className="timeline-stage">
          <TimelineLegend />
          <TimelineCanvas />
          <MiniOverview />
        </div>
      </main>

      <EventDetailsPanel />
      <DividerDetailsPanel />
    </div>
  )
}
