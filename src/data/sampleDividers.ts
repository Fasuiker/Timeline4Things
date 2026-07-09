import { format } from 'date-fns'
import type { TimelineDivider } from '@/types/timeline'

export function createSampleDividers(): TimelineDivider[] {
  const t = new Date()
  const d = (offset: number) => format(new Date(t.getTime() + offset * 86400000), 'yyyy-MM-dd')
  return [
    {
      id: 'div_001',
      title: '阶段一结束',
      date: d(14),
      color: '#dc2626',
    },
  ]
}
