import {
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  differenceInMonths,
  startOfMonth,
  startOfYear,
} from 'date-fns'

export interface OverviewTick {
  time: number
  label: string
  kind: 'month' | 'year'
}

export function getOverviewTicks(min: number, max: number): OverviewTick[] {
  const start = new Date(min)
  const end = new Date(max)
  const monthSpan = differenceInMonths(end, start)

  if (monthSpan <= 24) {
    return eachMonthOfInterval({ start: startOfMonth(start), end }).map((d) => ({
      time: d.getTime(),
      label: format(d, 'M月'),
      kind: 'month' as const,
    }))
  }

  return eachYearOfInterval({ start: startOfYear(start), end }).map((d) => ({
    time: d.getTime(),
    label: format(d, 'yyyy'),
    kind: 'year' as const,
  }))
}

export function getOverviewYearBands(min: number, max: number) {
  const start = new Date(min)
  const end = new Date(max)
  return eachYearOfInterval({ start: startOfYear(start), end }).map((d) => ({
    time: d.getTime(),
    label: format(d, 'yyyy年'),
  }))
}
