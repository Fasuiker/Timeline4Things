import { FloatingPanel } from '@/components/FloatingPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useTimelineStore } from '@/store/timelineStore'
import type { EventType, Importance, TimelineEvent } from '@/types/timeline'
import { cn } from '@/utils/cn'

const importanceOptions: { value: Importance; label: string }[] = [
  { value: 'critical', label: '紧急' },
  { value: 'high', label: '重要' },
  { value: 'medium', label: '普通' },
  { value: 'low', label: '低' },
]

const colorPresets = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b']

export function EventDetailsPanel() {
  const panelOpen = useTimelineStore((s) => s.panelOpen)
  const panelKind = useTimelineStore((s) => s.panelKind)
  const draftEvent = useTimelineStore((s) => s.draftEvent)
  const categories = useTimelineStore((s) => s.categories)
  const setDraftEvent = useTimelineStore((s) => s.setDraftEvent)
  const saveDraft = useTimelineStore((s) => s.saveDraft)
  const closePanel = useTimelineStore((s) => s.closePanel)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)
  const events = useTimelineStore((s) => s.events)

  if (!draftEvent) return null
  const isNew = !events.some((e) => e.id === draftEvent.id)

  const update = (patch: Partial<TimelineEvent>) => {
    setDraftEvent({ ...draftEvent, ...patch } as TimelineEvent)
  }

  const handleTypeChange = (type: EventType) => {
    if (type === 'point' && draftEvent.type === 'range') {
      setDraftEvent({ ...draftEvent, type: 'point', date: draftEvent.startDate })
    } else if (type === 'range' && draftEvent.type === 'point') {
      setDraftEvent({
        ...draftEvent,
        type: 'range',
        startDate: draftEvent.date,
        endDate: draftEvent.date,
      })
    }
  }

  return (
    <FloatingPanel
      open={panelOpen && panelKind === 'event'}
      onClose={closePanel}
      title={isNew ? '新建事件' : '编辑事件'}
      subtitle={draftEvent.type === 'point' ? '点事件 · 时间轴圆点标记' : '条事件 · 可拖拽调整时长'}
      footer={
        <>
          <Button className="flex-1" onClick={() => { saveDraft(); closePanel() }}>
            保存
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (isNew) { closePanel(); return }
              if (confirm('删除此事件？')) deleteEvent(draftEvent.id)
            }}
          >
            删除
          </Button>
        </>
      }
    >
      <div className="form-field">
        <label>标题</label>
        <Input value={draftEvent.title} onChange={(e) => update({ title: e.target.value })} />
      </div>

      <div className="form-field">
        <label>事件类型</label>
        <div className="segmented-control">
          {(
            [
              { value: 'point' as EventType, label: '● 点事件' },
              { value: 'range' as EventType, label: '▬ 条事件' },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={cn(draftEvent.type === value && 'is-active')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {draftEvent.type === 'point' ? (
        <div className="form-field">
          <label>日期</label>
          <Input type="date" value={draftEvent.date} onChange={(e) => update({ date: e.target.value })} />
        </div>
      ) : (
        <div className="form-row">
          <div className="form-field">
            <label>开始</label>
            <Input type="date" value={draftEvent.startDate} onChange={(e) => update({ startDate: e.target.value })} />
          </div>
          <div className="form-field">
            <label>结束</label>
            <Input type="date" value={draftEvent.endDate} onChange={(e) => update({ endDate: e.target.value })} />
          </div>
        </div>
      )}

      <div className="form-field">
        <label>重要性</label>
        <div className="chip-group">
          {importanceOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ importance: value })}
              className={cn('chip', draftEvent.importance === value && 'is-active')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label>分类</label>
        <select
          value={draftEvent.category}
          onChange={(e) => update({ category: e.target.value })}
          className="form-select"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>颜色</label>
        <div className="color-swatches">
          {colorPresets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => update({ color })}
              className={cn('color-swatch', draftEvent.color === color && 'is-active')}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="form-field">
        <label>标签</label>
        <Input
          value={(draftEvent.tags ?? []).join(', ')}
          onChange={(e) =>
            update({
              tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
            })
          }
          placeholder="planning, research"
        />
      </div>

      <div className="form-field">
        <label>描述</label>
        <Textarea
          value={draftEvent.description ?? ''}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="事件描述..."
        />
      </div>
    </FloatingPanel>
  )
}
