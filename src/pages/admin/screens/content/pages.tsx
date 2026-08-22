import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

export function AdminPages() {
  const rows = [
    ['About Saramin Vietnam', '/about', '12/06/2026', <Pill tone="active">Published</Pill>],
    ['Terms of Service', '/legal/terms', '01/05/2026', <Pill tone="active">Published</Pill>],
    ['Privacy Policy', '/legal/privacy', '01/05/2026', <Pill tone="active">Published</Pill>],
    ['Service guide — Employers', '/guide/employer', '20/07/2026', <Pill tone="draft">Draft</Pill>],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 24, active: true }, { label: 'Published', count: 19 }, { label: 'Draft', count: 5 }]}
      cols={[{ label: 'Page', w: '1.8fr' }, { label: 'Slug', w: '1.4fr' }, { label: 'Updated', w: '1fr' }, { label: 'Status', w: '0.9fr', align: 'r' }]}
      rows={rows}
    />
  )
}
