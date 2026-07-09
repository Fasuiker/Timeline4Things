export type Importance = 'low' | 'medium' | 'high' | 'critical'
export type EventType = 'point' | 'range'
export type TimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year'
export type ViewMode = 'compact' | 'lane'

export interface Category {
  id: string
  name: string
  color: string
}

export interface TimelineEventBase {
  id: string
  title: string
  type: EventType
  importance: Importance
  category: string
  description?: string
  color?: string
  tags?: string[]
}

export interface PointEvent extends TimelineEventBase {
  type: 'point'
  date: string
}

export interface RangeEvent extends TimelineEventBase {
  type: 'range'
  startDate: string
  endDate: string
}

export type TimelineEvent = PointEvent | RangeEvent

export interface TimelineDivider {
  id: string
  title: string
  date: string
  color?: string
}

export interface TimelineData {
  version: number
  events: TimelineEvent[]
  categories: Category[]
  dividers?: TimelineDivider[]
}

export interface TimelineFilters {
  categories: string[]
  importance: Importance[]
  tags: string[]
}
