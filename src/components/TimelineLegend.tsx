import { Circle, SeparatorVertical } from 'lucide-react'

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-[11px] text-slate-500 border-b border-slate-200/60">
      {[
        { icon: <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />, label: '点事件' },
        { icon: <span className="h-2 w-8 rounded-md bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm" />, label: '条事件' },
        { icon: <SeparatorVertical className="h-3.5 w-3.5 text-red-400" />, label: '分界线' },
        { icon: <SeparatorVertical className="h-3.5 w-3.5 text-blue-500" />, label: '当前时间' },
      ].map(({ icon, label }) => (
        <span key={label} className="flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2.5 py-1 font-medium text-slate-600">
          {icon}
          {label}
        </span>
      ))}
      <span className="ml-auto flex items-center gap-1 text-slate-400">
        <Circle className="h-2 w-2" />
        双击空白添加点事件
      </span>
    </div>
  )
}
