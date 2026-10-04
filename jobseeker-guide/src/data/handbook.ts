import type { Handbook } from './types'

/** The deployed jobseeker site this handbook describes. Every deep link is built from it. */
export const SITE_BASE = 'https://dev.svn.topdev.asia'
export const siteUrl = (path: string) => `${SITE_BASE}${path}`

export const GROUPS = ['Bắt đầu', 'Tài khoản'] as const

export const HANDBOOK: Handbook = {
  title: 'Tài khoản ứng viên, coi một lần là hiểu',
  lead: 'Đang soạn.',
  quick: [],
  keyFact: { heading: '', text: '' },
  links: [],
  sections: [{ id: 'tong-quan', group: 'Bắt đầu', code: 'TQ', label: 'Tổng quan', title: 'Tổng quan', blocks: [] }],
  source: { web: '', be: '', date: '' },
}
