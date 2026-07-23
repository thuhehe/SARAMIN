import type { Status } from '@/data/types'

interface StatusMeta {
  label: string
  /** short label for tight spaces (nav dot legend) */
  short: string
  /** tailwind classes for the pill */
  pill: string
  /** dot colour */
  dot: string
  description: string
}

export const STATUS_META: Record<Status, StatusMeta> = {
  'live-wired': {
    label: 'Live-wired',
    short: 'Live',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Screen exists AND is connected to the real backend today.',
  },
  'built-mock': {
    label: 'Built (mock UI)',
    short: 'Mock',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    description: 'Screen is built but still serving mock / demo data (not connected).',
  },
  'be-migrated': {
    label: 'BE-migrated',
    short: 'BE',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Admin module reads / writes the real backend.',
  },
  prototype: {
    label: 'Prototype (Prisma)',
    short: 'Proto',
    pill: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    description: 'Works but only against the local prototype DB — pending backend migration.',
  },
  'empty-seam': {
    label: 'Empty seam',
    short: 'Seam',
    pill: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    description: 'Route / menu exists but the page is a placeholder; no backend behind it.',
  },
  'not-started': {
    label: 'Not started',
    short: 'None',
    pill: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    description: 'Not built yet.',
  },
  unknown: {
    label: 'Unknown',
    short: '?',
    pill: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-300',
    description: 'Status not yet assessed.',
  },
}

export const STATUS_ORDER: Status[] = [
  'live-wired',
  'be-migrated',
  'built-mock',
  'prototype',
  'empty-seam',
  'not-started',
]
