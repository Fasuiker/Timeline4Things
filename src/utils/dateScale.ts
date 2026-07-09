import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import type { TimeScale } from '@/types/timeline'

export function getWindowForScale(scale: TimeScale, anchor = new Date()) {
  switch (scale) {
    case 'day':
      return { start: startOfDay(anchor), end: endOfDay(anchor) }
    case 'week':
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      }
    case 'month':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) }
    case 'quarter':
      return { start: startOfQuarter(anchor), end: endOfQuarter(anchor) }
    case 'year':
      return { start: startOfYear(anchor), end: endOfYear(anchor) }
  }
}

export function zoomWindow(
  start: Date,
  end: Date,
  factor: number,
  anchorRatio = 0.5,
): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime()
  const newDuration = duration * factor
  const anchorTime = start.getTime() + duration * anchorRatio
  return {
    start: new Date(anchorTime - newDuration * anchorRatio),
    end: new Date(anchorTime + newDuration * (1 - anchorRatio)),
  }
}

export function shiftWindow(start: Date, end: Date, ratio: number) {
  const duration = end.getTime() - start.getTime()
  const offset = duration * ratio
  return {
    start: new Date(start.getTime() + offset),
    end: new Date(end.getTime() + offset),
  }
}

/** Match vis-timeline horizontal wheel pan speed. */
export function panWindowByWheel(
  start: Date,
  end: Date,
  event: Pick<WheelEvent, 'deltaX' | 'deltaY'>,
): { start: Date; end: Date } {
  const deltaY = -event.deltaY
  const deltaX = event.deltaX
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? deltaY : deltaX
  const duration = end.getTime() - start.getTime()
  const diff = (delta / 120) * (duration / 20)
  return {
    start: new Date(start.getTime() + diff),
    end: new Date(end.getTime() + diff),
  }
}

export function parseDate(value: string): Date {
  return new Date(value + (value.length === 10 ? 'T12:00:00' : ''))
}

export function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addScale(amount: number, scale: TimeScale, date: Date) {
  switch (scale) {
    case 'day':
      return addDays(date, amount)
    case 'week':
      return addWeeks(date, amount)
    case 'month':
      return addMonths(date, amount)
    case 'quarter':
      return addQuarters(date, amount)
    case 'year':
      return addYears(date, amount)
  }
}
