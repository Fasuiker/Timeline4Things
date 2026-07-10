import type { Category, Importance, PointEvent, RangeEvent, TimelineEvent } from '@/types/timeline'

const importanceStyles: Record<Importance, { bg: string; border: string; text: string }> = {
  critical: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  high: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  medium: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  low: { bg: '#f8fafc', border: '#94a3b8', text: '#475569' },
}

export function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function getCategoryColor(categories: Category[], name: string) {
  return categories.find((c) => c.name === name)?.color ?? '#64748b'
}

export function formatEventDate(event: TimelineEvent) {
  if (event.type === 'point') return event.date
  return `${event.startDate} → ${event.endDate}`
}

export function buildRangeStyle(event: RangeEvent, categories: Category[]) {
  const catColor = event.color ?? getCategoryColor(categories, event.category)
  const imp = importanceStyles[event.importance]

  if (event.color) {
    return [
      `background-color:${hexToRgba(catColor, 0.22)}`,
      `border-color:${catColor}`,
      `color:#0f172a`,
      `border-width:1.5px`,
    ].join(';')
  }

  return [
    `background-color:${imp.bg}`,
    `border-color:${imp.border}`,
    `color:${imp.text}`,
    `border-width:1.5px`,
  ].join(';')
}

export function buildPointStyle(event: PointEvent, categories: Category[]) {
  const color = event.color ?? getCategoryColor(categories, event.category)
  return [
    `background-color:${color}`,
    `border-color:${color}`,
    `color:#ffffff`,
    `border-width:2.5px`,
  ].join(';')
}

export function buildPointContent(event: PointEvent) {
  return `<span class="tl-point-label">${escapeHtml(event.title)}</span>`
}

export function buildRangeContent(event: RangeEvent) {
  return escapeHtml(event.title)
}

export function buildGroupLabel(category: Category) {
  return `
    <span class="tl-lane-label">
      <span class="tl-lane-dot" style="background:${category.color}"></span>
      ${escapeHtml(category.name)}
    </span>
  `
}
