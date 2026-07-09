import { FloatingPanel } from '@/components/FloatingPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTimelineStore } from '@/store/timelineStore'
import { cn } from '@/utils/cn'

const colorPresets = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#64748b']

export function DividerDetailsPanel() {
  const panelOpen = useTimelineStore((s) => s.panelOpen)
  const panelKind = useTimelineStore((s) => s.panelKind)
  const draftDivider = useTimelineStore((s) => s.draftDivider)
  const dividers = useTimelineStore((s) => s.dividers)
  const setDraftDivider = useTimelineStore((s) => s.setDraftDivider)
  const saveDivider = useTimelineStore((s) => s.saveDivider)
  const closePanel = useTimelineStore((s) => s.closePanel)
  const deleteDivider = useTimelineStore((s) => s.deleteDivider)

  if (!draftDivider) return null
  const isNew = !dividers.some((d) => d.id === draftDivider.id)

  return (
    <FloatingPanel
      open={panelOpen && panelKind === 'divider'}
      onClose={closePanel}
      title={isNew ? '新建分界线' : '编辑分界线'}
      subtitle="竖线标记 · 阶段切换与关键节点"
      accent="red"
      footer={
        <>
          <Button className="flex-1" onClick={() => { saveDivider(); closePanel() }}>
            保存
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (isNew) { closePanel(); return }
              if (confirm('删除此分界线？')) deleteDivider(draftDivider.id)
            }}
          >
            删除
          </Button>
        </>
      }
    >
      <div className="form-field">
        <label>名称</label>
        <Input
          value={draftDivider.title}
          onChange={(e) => setDraftDivider({ ...draftDivider, title: e.target.value })}
          placeholder="例如：阶段一结束"
        />
      </div>

      <div className="form-field">
        <label>日期</label>
        <Input
          type="date"
          value={draftDivider.date}
          onChange={(e) => setDraftDivider({ ...draftDivider, date: e.target.value })}
        />
      </div>

      <div className="form-field">
        <label>线条颜色</label>
        <div className="color-swatches">
          {colorPresets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setDraftDivider({ ...draftDivider, color })}
              className={cn('color-swatch', draftDivider.color === color && 'is-active')}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </FloatingPanel>
  )
}
