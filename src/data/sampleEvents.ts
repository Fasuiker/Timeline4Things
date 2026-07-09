import { addDays, addMonths, addQuarters, format } from 'date-fns'
import type { Category, TimelineEvent } from '@/types/timeline'

export const defaultCategories: Category[] = [
  { id: 'work', name: 'Work', color: '#2563eb' },
  { id: 'research', name: 'Research', color: '#0891b2' },
  { id: 'paper', name: 'Paper', color: '#7c3aed' },
  { id: 'dataset', name: 'Dataset', color: '#059669' },
  { id: 'meeting', name: 'Meeting', color: '#d97706' },
  { id: 'deadline', name: 'Deadline', color: '#dc2626' },
  { id: 'personal', name: 'Personal', color: '#64748b' },
]

function today() {
  return format(new Date(), 'yyyy-MM-dd')
}

export function createSampleEvents(): TimelineEvent[] {
  const t = new Date()
  const d = (offset: number) => format(addDays(t, offset), 'yyyy-MM-dd')
  const m = (offset: number) => format(addMonths(t, offset), 'yyyy-MM-dd')
  const q = (offset: number) => format(addQuarters(t, offset), 'yyyy-MM-dd')

  return [
    {
      id: 'evt_001',
      type: 'point',
      title: 'Project kickoff',
      date: today(),
      importance: 'high',
      category: 'Work',
      tags: ['planning'],
      description: 'Initial project kickoff meeting with the team.',
    },
    {
      id: 'evt_002',
      type: 'range',
      title: 'Dataset download',
      startDate: d(-2),
      endDate: d(3),
      importance: 'medium',
      category: 'Dataset',
      tags: ['dataset', 'preprocessing'],
      description: 'Download and preprocess the benchmark dataset.',
    },
    {
      id: 'evt_003',
      type: 'range',
      title: 'Model baseline experiments',
      startDate: d(-5),
      endDate: d(20),
      importance: 'high',
      category: 'Research',
      tags: ['baseline', 'experiments'],
      description: 'Run baseline models and compare performance metrics.',
    },
    {
      id: 'evt_004',
      type: 'point',
      title: 'Weekly sync',
      date: d(2),
      importance: 'low',
      category: 'Meeting',
      tags: ['sync'],
      description: 'Regular team sync meeting.',
    },
    {
      id: 'evt_005',
      type: 'range',
      title: 'Paper draft',
      startDate: m(1),
      endDate: m(2),
      importance: 'high',
      category: 'Paper',
      tags: ['writing'],
      description: 'First draft of the research paper.',
    },
    {
      id: 'evt_006',
      type: 'point',
      title: 'Submission deadline',
      date: q(1),
      importance: 'critical',
      category: 'Deadline',
      tags: ['deadline', 'submission'],
      description: 'Conference paper submission deadline.',
    },
    {
      id: 'evt_007',
      type: 'point',
      title: 'Literature review',
      date: d(-7),
      importance: 'medium',
      category: 'Research',
      tags: ['reading'],
      description: 'Review related work in the field.',
    },
    {
      id: 'evt_008',
      type: 'range',
      title: 'Code refactoring',
      startDate: d(5),
      endDate: d(12),
      importance: 'medium',
      category: 'Work',
      tags: ['engineering'],
      description: 'Refactor experiment pipeline for reproducibility.',
    },
    {
      id: 'evt_009',
      type: 'point',
      title: 'Advisor meeting',
      date: d(4),
      importance: 'high',
      category: 'Meeting',
      tags: ['advisor'],
      description: 'Progress update with advisor.',
    },
    {
      id: 'evt_010',
      type: 'point',
      title: 'Conference registration',
      date: m(3),
      importance: 'low',
      category: 'Personal',
      tags: ['travel'],
      description: 'Register for the upcoming conference.',
    },
  ]
}
