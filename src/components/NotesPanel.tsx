import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { NotebookPen, Plus, Trash2 } from 'lucide-react'
import { FloatingPanel } from '@/components/FloatingPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useTimelineStore } from '@/store/timelineStore'
import type { TimelineNote } from '@/types/timeline'
import { cn } from '@/utils/cn'

const DRAG_STEP = 72

function formatNoteDate(date: string) {
  try {
    return format(parseISO(date), 'yyyy年M月d日 EEEE', { locale: zhCN })
  } catch {
    return date
  }
}

function formatUpdatedAt(iso: string) {
  try {
    return format(parseISO(iso), 'M月d日 HH:mm', { locale: zhCN })
  } catch {
    return ''
  }
}

function previewText(content: string) {
  const text = content.replace(/\s+/g, ' ').trim()
  if (!text) return '暂无内容'
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

function sortNotes(notes: TimelineNote[]) {
  return [...notes].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function NotesPanel() {
  const panelOpen = useTimelineStore((s) => s.panelOpen)
  const panelKind = useTimelineStore((s) => s.panelKind)
  const notes = useTimelineStore((s) => s.notes)
  const draftNote = useTimelineStore((s) => s.draftNote)
  const setDraftNote = useTimelineStore((s) => s.setDraftNote)
  const saveNote = useTimelineStore((s) => s.saveNote)
  const deleteNote = useTimelineStore((s) => s.deleteNote)
  const openNotesPanel = useTimelineStore((s) => s.openNotesPanel)
  const closePanel = useTimelineStore((s) => s.closePanel)

  const sortedNotes = useMemo(() => sortNotes(notes), [notes])
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    startY: number
    pointerId: number | null
    startIndex: number
    targetIndex: number | null
  }>({
    startY: 0,
    pointerId: null,
    startIndex: 0,
    targetIndex: null,
  })
  const count = sortedNotes.length

  /** Always show up to 3 slots: previous / current / next (with wrap). */
  const visibleCards = useMemo(() => {
    if (count === 0) return [] as { note: TimelineNote; index: number; offset: number }[]
    if (count === 1) {
      return [{ note: sortedNotes[0], index: 0, offset: 0 }]
    }
    const prev = (activeIndex - 1 + count) % count
    const next = (activeIndex + 1) % count
    return [
      { note: sortedNotes[prev], index: prev, offset: -1 },
      { note: sortedNotes[activeIndex], index: activeIndex, offset: 0 },
      { note: sortedNotes[next], index: next, offset: 1 },
    ]
  }, [sortedNotes, activeIndex, count])

  useEffect(() => {
    if (!draftNote || sortedNotes.length === 0) {
      setActiveIndex(0)
      return
    }
    const idx = sortedNotes.findIndex((n) => n.id === draftNote.id)
    if (idx >= 0) setActiveIndex(idx)
  }, [draftNote?.id, sortedNotes])

  if (!draftNote) return null

  const isExisting = notes.some((n) => n.id === draftNote.id)

  const update = (patch: Partial<TimelineNote>) => {
    setDraftNote({ ...draftNote, ...patch })
  }

  const goTo = (index: number) => {
    if (count === 0) return
    const next = ((index % count) + count) % count
    setActiveIndex(next)
    openNotesPanel(sortedNotes[next])
  }

  const beginDrag = (e: ReactPointerEvent, targetIndex: number | null = null) => {
    if (count <= 1) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = {
      startY: e.clientY,
      pointerId: e.pointerId,
      startIndex: activeIndex,
      targetIndex,
    }
    setDragging(true)
    setDragY(0)
  }

  const moveDrag = (e: ReactPointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    const dy = e.clientY - dragRef.current.startY
    // Clamp so one gesture mainly moves one step.
    setDragY(Math.max(-DRAG_STEP * 1.2, Math.min(DRAG_STEP * 1.2, dy)))
  }

  const endDrag = (e: ReactPointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return
    const dy = e.clientY - dragRef.current.startY
    const targetIndex = dragRef.current.targetIndex
    dragRef.current.pointerId = null
    setDragging(false)
    setDragY(0)

    if (Math.abs(dy) >= 36) {
      // Drag up → older/next; drag down → newer/prev
      if (dy < 0) goTo(activeIndex + 1)
      else goTo(activeIndex - 1)
      return
    }

    // Short press on a side card → select it
    if (targetIndex != null && targetIndex !== activeIndex) {
      goTo(targetIndex)
    }
  }

  const dragProgress = dragging ? dragY / DRAG_STEP : 0

  return (
    <FloatingPanel
      open={panelOpen && panelKind === 'notes'}
      onClose={closePanel}
      title="笔记"
      subtitle="按日期记录 · 拖动卡片轮转 · 自动保存"
      wide
      footer={
        <>
          <Button className="flex-1" onClick={() => saveNote()}>
            保存笔记
          </Button>
          <Button variant="outline" onClick={() => openNotesPanel()} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            新建
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!isExisting) {
                openNotesPanel()
                return
              }
              if (confirm('删除这篇笔记？')) deleteNote(draftNote.id)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      }
    >
      <div className="notes-layout notes-layout--carousel">
        <div className="notes-carousel-section">
          <div className="notes-carousel-head">
            <span>笔记卡片</span>
            <span className="notes-count">{count}</span>
          </div>

          {count === 0 ? (
            <div className="notes-empty notes-empty--carousel">
              <NotebookPen className="h-6 w-6 text-slate-300" />
              <p>还没有笔记</p>
              <p>写一篇今天的记录，它会出现在时间轴上</p>
            </div>
          ) : (
            <>
              <div className="notes-carousel notes-carousel--vertical">
                <div
                  className={cn('notes-carousel-stage', dragging && 'is-dragging')}
                  onPointerDown={(e) => beginDrag(e)}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  {visibleCards.map(({ note, index, offset }) => {
                    const liveOffset = offset + dragProgress
                    const abs = Math.min(1.4, Math.abs(liveOffset))
                    return (
                      <div
                        key={`${note.id}-${offset}`}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          'note-cover-card',
                          offset === 0 && !dragging && 'is-active',
                          Math.abs(liveOffset) < 0.35 && 'is-front',
                          liveOffset < -0.2 && 'is-above',
                          liveOffset > 0.2 && 'is-below',
                          dragging && 'is-dragging',
                        )}
                        style={
                          {
                            '--offset': liveOffset,
                            '--abs': abs,
                          } as CSSProperties
                        }
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          beginDrag(e, index)
                        }}
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            goTo(index)
                          }
                        }}
                      >
                        <div className="note-cover-date">{formatNoteDate(note.date)}</div>
                        <div className="note-cover-title">{note.title || '无标题笔记'}</div>
                        <div className="note-cover-preview">{previewText(note.content)}</div>
                        <div className="note-cover-meta">更新于 {formatUpdatedAt(note.updatedAt)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="notes-carousel-dots notes-carousel-dots--vertical">
                {sortedNotes.map((note, index) => (
                  <button
                    key={note.id}
                    type="button"
                    className={cn('notes-dot', index === activeIndex && 'is-active')}
                    onClick={() => goTo(index)}
                    aria-label={`第 ${index + 1} 篇`}
                  />
                ))}
              </div>
              <div className="notes-carousel-hint">按住卡片上下拖动轮转 · 轻点侧卡也可切换</div>
            </>
          )}
        </div>

        <div className="notes-editor">
          <div className="form-field">
            <label>日期</label>
            <Input
              type="date"
              value={draftNote.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>标题</label>
            <Input
              value={draftNote.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="今天想记点什么…"
            />
          </div>
          <div className="form-field notes-content-field">
            <label>内容</label>
            <Textarea
              className="notes-textarea"
              value={draftNote.content}
              onChange={(e) => update({ content: e.target.value })}
              placeholder="写下想法、进展或备忘…"
            />
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}
