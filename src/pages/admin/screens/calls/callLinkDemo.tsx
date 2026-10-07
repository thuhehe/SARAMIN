import { useContext, useState } from 'react'
import { ScreenNavCtx } from '@/pages/admin/ctx'
import { COMPANIES } from '@/pages/admin/data/companies'
import { CALLS, needsLink } from '@/pages/admin/data/callLink'
import { ME } from '@/pages/admin/data/salesOrg'
import { CompanyDetail } from '@/pages/admin/screens/companies/detail'
import { CallsToLinkTray } from '@/pages/admin/screens/calls/callLink'

/*
 * Spec-page preview for "Calls — link every Callio call to a company". The Call card lives
 * on the company record (Overview → Log an activity), which the console reaches by
 * opening a row on Customers — so this screen opens a record straight on it, with the Call
 * card already open, and the signed-in rep's Calls to link tray at the bottom-right.
 * Three paths, one per strip button: start from the CRM · called straight from Callio ·
 * the result on the call log.
 */
const COMPANY = 'Công ty TNHH Đại Dương'

export function AdminCallLinkDemo() {
  const goTo = useContext(ScreenNavCtx)
  const c = COMPANIES.find((x) => x.name === COMPANY) ?? COMPANIES[0]
  const [waiting, setWaiting] = useState(() => CALLS.filter((r) => needsLink(r) && r.rep === ME))
  const [n, setN] = useState(0)
  return (
    <div>
      <div className="mb-3 rounded-lg border border-line bg-canvas/60 px-3 py-2 text-[11.5px] text-muted">
        <p>
          <b className="text-ink/80">Đề xuất — mỗi cuộc gọi Callio nằm trên đúng công ty.</b>{' '}
          <b className="text-ink/80">①</b> Gọi từ CRM: thẻ <b className="text-ink/80">Call</b> bên dưới — click <i>Copy &amp; open Callio</i> là đã liên kết.{' '}
          <b className="text-ink/80">②</b> Gọi thẳng trong Callio: khay <b className="text-ink/80">Calls to link</b> góc dưới phải — chính sales vừa gọi chọn công ty.{' '}
          <b className="text-ink/80">③</b> Kết quả: <button onClick={() => goTo('admin-call-logs')} className="font-semibold text-brand hover:underline">Call logs →</button> có Company · Contact person · Linked by.
        </p>
        <button onClick={() => setN((x) => x + 1)} className="mt-1 font-medium text-brand hover:underline">↺ Reset the Call card</button>
      </div>
      <CompanyDetail key={n} c={c} onBack={() => setN((x) => x + 1)} initialTab="Overview" initialCall />
      <CallsToLinkTray
        calls={waiting}
        onLinked={(id) => setWaiting((w) => w.filter((r) => r.id !== id))}
        onArchived={(id) => setWaiting((w) => w.filter((r) => r.id !== id))}
      />
    </div>
  )
}
