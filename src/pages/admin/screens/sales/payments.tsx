import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

export function AdminPayments() {
  const rows = [
    ['PAY-1042', 'Công ty Vạn Phát', 'SO-1188', '37,800,000 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '26/07/2026'],
    ['PAY-1043', 'AM Software Việt Nam', 'SO-1189', '6,588,000 ₫', 'Bank transfer', <Pill tone="pending">Recorded — to confirm</Pill>, '27/07/2026'],
    ['PAY-1044', 'Trường Sơn', 'SO-1185', '73,929,353 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '24/07/2026'],
    ['PAY-1045', 'Á Châu', 'SO-1182', '19,934,148 ₫', 'Cash', <Pill tone="rejected">Unmatched</Pill>, '20/07/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'Awaiting payment', count: 9 }, { label: 'To confirm', count: 4, active: true }, { label: 'Confirmed' }, { label: 'To invoice', count: 2 }, { label: 'Unmatched', count: 1 }]}
      cols={[{ label: 'Reference', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Order', w: '0.9fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Method', w: '1.1fr' }, { label: 'Status', w: '1.6fr' }, { label: 'Paid', w: '0.9fr', align: 'r' }]}
      rows={rows}
      minW={860}
    />
  )
}
export function AdminContracts() {
  const rows = [
    ['CT-0912', 'Trường Sơn', '546,679,016 ₫', <Pill tone="active">Active</Pill>, '20/04/2026 – 20/04/2027'],
    ['CT-0913', 'Phương Đông', '498,258,424 ₫', <Pill tone="expired">Expired</Pill>, '20/05/2025 – 15/04/2026'],
    ['CT-0914', 'Hồng Đức', '152,568,060 ₫', <Pill tone="draft">Draft</Pill>, '30/03/2026 – 04/09/2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Contract', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Value', w: '1.2fr', align: 'r' }, { label: 'Status', w: '1fr' }, { label: 'Validity', w: '1.8fr', align: 'r' }]}
      rows={rows}
    />
  )
}
