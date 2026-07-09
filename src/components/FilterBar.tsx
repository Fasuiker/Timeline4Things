import { AlertCircle, Circle, Minus } from 'lucide-react'
import { useAllTags } from '@/hooks/useFilteredEvents'
import { useTimelineStore } from '@/store/timelineStore'
import type { Importance } from '@/types/timeline'
import { cn } from '@/utils/cn'

const importanceOptions: { value: Importance; label: string; icon: typeof Circle }[] = [
  { value: 'critical', label: '紧急', icon: AlertCircle },
  { value: 'high', label: '重要', icon: Circle },
  { value: 'medium', label: '普通', icon: Circle },
  { value: 'low', label: '低', icon: Minus },
]

export function FilterBar() {
  const categories = useTimelineStore((s) => s.categories)
  const filters = useTimelineStore((s) => s.filters)
  const allTags = useAllTags()
  const toggleFilterCategory = useTimelineStore((s) => s.toggleFilterCategory)
  const toggleFilterImportance = useTimelineStore((s) => s.toggleFilterImportance)
  const toggleFilterTag = useTimelineStore((s) => s.toggleFilterTag)

  const hasActive =
    filters.categories.length > 0 || filters.importance.length > 0 || filters.tags.length > 0

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2 border-b border-slate-200/60 bg-white/50 px-5 py-2 backdrop-blur-md">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">筛选</span>

      {categories.map((cat) => {
        const active = filters.categories.includes(cat.name)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggleFilterCategory(cat.name)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
              active
                ? 'text-white shadow-sm'
                : 'bg-white/70 text-slate-600 ring-1 ring-slate-200/80 hover:ring-slate-300',
            )}
            style={active ? { backgroundColor: cat.color } : undefined}
          >
            {!active && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />}
            {cat.name}
          </button>
        )
      })}

      <span className="mx-1 h-3.5 w-px bg-slate-200" />

      {importanceOptions.map(({ value, label, icon: Icon }) => {
        const active = filters.importance.includes(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => toggleFilterImportance(value)}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
              active
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/30'
                : 'bg-white/70 text-slate-600 ring-1 ring-slate-200/80',
            )}
          >
            <Icon className="h-2.5 w-2.5" />
            {label}
          </button>
        )
      })}

      {allTags.length > 0 && (
        <>
          <span className="mx-1 h-3.5 w-px bg-slate-200" />
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleFilterTag(tag)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-all',
                filters.tags.includes(tag)
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white/70 text-slate-600 ring-1 ring-slate-200/80',
              )}
            >
              #{tag}
            </button>
          ))}
        </>
      )}

      {hasActive && (
        <button
          type="button"
          onClick={() => useTimelineStore.getState().setFilters({ categories: [], importance: [], tags: [] })}
          className="ml-auto text-[11px] font-medium text-blue-500 hover:text-blue-600"
        >
          清除
        </button>
      )}
    </div>
  )
}
