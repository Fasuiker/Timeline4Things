import {
  ALargeSmall,
  Calendar,
  Circle,
  Cloud,
  Download,
  LayoutGrid,
  LayoutList,
  Maximize2,
  Minus,
  NotebookPen,
  Search,
  SeparatorVertical,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip'
import { useTimelineStore } from '@/store/timelineStore'
import type { TimeScale, ViewMode } from '@/types/timeline'
import { cn } from '@/utils/cn'

const scales: { value: TimeScale; label: string }[] = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
  { value: 'quarter', label: '季' },
  { value: 'year', label: '年' },
]

export function TimelineToolbar() {
  const timeScale = useTimelineStore((s) => s.timeScale)
  const viewMode = useTimelineStore((s) => s.viewMode)
  const searchQuery = useTimelineStore((s) => s.searchQuery)
  const setTimeScale = useTimelineStore((s) => s.setTimeScale)
  const setViewMode = useTimelineStore((s) => s.setViewMode)
  const setSearchQuery = useTimelineStore((s) => s.setSearchQuery)
  const goToToday = useTimelineStore((s) => s.goToToday)
  const fitAll = useTimelineStore((s) => s.fitAll)
  const zoom = useTimelineStore((s) => s.zoom)
  const displayScale = useTimelineStore((s) => s.displayScale)
  const adjustDisplayScale = useTimelineStore((s) => s.adjustDisplayScale)
  const openPanel = useTimelineStore((s) => s.openPanel)
  const openDividerPanel = useTimelineStore((s) => s.openDividerPanel)
  const openNotesPanel = useTimelineStore((s) => s.openNotesPanel)
  const exportData = useTimelineStore((s) => s.exportData)
  const importData = useTimelineStore((s) => s.importData)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try { importData(reader.result as string) }
        catch { alert('JSON 格式无效') }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <TooltipProvider>
      <header className="glass-toolbar">
        <div className="brand-mark">
          <div className="brand-icon">T</div>
          <span className="brand-name">Timeline4Things</span>
        </div>

        <span className="save-badge">
          <Cloud className="h-3 w-3" />
          自动保存
        </span>

        <div className="toolbar-divider" />

        <div className="relative min-w-[140px] flex-1 max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-8 border-slate-200/80 bg-white/80 pl-8 text-xs"
            placeholder="搜索事件..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="scale-pills">
          {scales.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setTimeScale(s.value)}
              className={cn('scale-pill', timeScale === s.value && 'is-active')}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="toolbar-divider" />

        <div className="flex items-center gap-0.5">
          <Tooltip content="今天">
            <Button variant="ghost" size="icon" onClick={goToToday}><Calendar className="h-4 w-4" /></Button>
          </Tooltip>
          <Tooltip content="适应全部">
            <Button variant="ghost" size="icon" onClick={fitAll}><Maximize2 className="h-4 w-4" /></Button>
          </Tooltip>
          <Tooltip content="放大">
            <Button variant="ghost" size="icon" onClick={() => zoom(0.75)}><ZoomIn className="h-4 w-4" /></Button>
          </Tooltip>
          <Tooltip content="缩小">
            <Button variant="ghost" size="icon" onClick={() => zoom(1.33)}><ZoomOut className="h-4 w-4" /></Button>
          </Tooltip>
        </div>

        <div className="toolbar-divider" />

        <div className="flex items-center gap-1">
          <Tooltip content="界面缩小">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustDisplayScale(-0.25)}
              disabled={displayScale <= 1}
            >
              <ALargeSmall className="h-4 w-4 scale-90" />
            </Button>
          </Tooltip>
          <span className="min-w-[3rem] text-center text-[11px] font-semibold tabular-nums text-slate-500">
            {Math.round(displayScale * 100)}%
          </span>
          <Tooltip content="界面放大">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => adjustDisplayScale(0.25)}
              disabled={displayScale >= 2.5}
            >
              <ALargeSmall className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>

        <div className="toolbar-divider" />

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => openPanel(undefined, 'point')} className="h-8 gap-1 border-slate-200/80 bg-white/60 text-xs">
            <Circle className="h-3 w-3" /> 点
          </Button>
          <Button variant="outline" size="sm" onClick={() => openPanel(undefined, 'range')} className="h-8 gap-1 border-slate-200/80 bg-white/60 text-xs">
            <Minus className="h-3 w-3" /> 条
          </Button>
          <Button variant="outline" size="sm" onClick={() => openDividerPanel()} className="h-8 gap-1 border-slate-200/80 bg-white/60 text-xs">
            <SeparatorVertical className="h-3 w-3" /> 线
          </Button>
          <Button variant="outline" size="sm" onClick={() => openNotesPanel()} className="h-8 gap-1 border-slate-200/80 bg-white/60 text-xs">
            <NotebookPen className="h-3 w-3" /> 笔记
          </Button>
        </div>

        <div className="scale-pills">
          {(
            [
              { value: 'compact' as ViewMode, icon: LayoutList },
              { value: 'lane' as ViewMode, icon: LayoutGrid },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setViewMode(value)}
              className={cn('scale-pill px-2', viewMode === value && 'is-active')}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip content="导出">
            <Button variant="ghost" size="icon" onClick={handleExport}><Download className="h-4 w-4" /></Button>
          </Tooltip>
          <Tooltip content="导入">
            <Button variant="ghost" size="icon" onClick={handleImport}><Upload className="h-4 w-4" /></Button>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
}
