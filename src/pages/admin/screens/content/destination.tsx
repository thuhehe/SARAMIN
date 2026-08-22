/* Where a banner or popup points, shared by both publish flows. */
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PLACEMENT_POS } from '@/pages/admin/data/content'
import { FLabel } from '@/pages/admin/ui/fields'

/* Where a placement sends the jobseeker. Shared by banners and popups because the
   answer is the same for both: inside the site, to one of three things. Stores the
   ID rather than a URL, so a slug change never breaks a paid placement. */
export function DestinationPicker() {
  const [target, setTarget] = useState<'job' | 'company' | 'jobs'>('company')
  return (
    <div>
      <FLabel req>Link đích<span className="ml-1 font-normal text-faint">nội bộ</span></FLabel>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {([
          ['job', 'Một job', 'Job detail'],
          ['company', 'Trang công ty', 'Company page'],
          ['jobs', 'Job list của công ty', 'Company job list'],
        ] as const).map(([v, label, sub]) => (
          <button
            key={v}
            onClick={() => setTarget(v)}
            className={cn('rounded-lg border px-2.5 py-1.5 text-left transition-colors', target === v ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}
          >
            <span className={cn('block text-[11.5px] font-medium', target === v ? 'text-brand' : 'text-ink')}>{label}</span>
            <span className="block text-[10px] text-faint">{sub}</span>
          </button>
        ))}
      </div>
      <div className="mt-1.5">
        <select className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
          {target === 'job' && <>
            <option>— Chọn job —</option>
            <option>JOB-2109 · Digital Marketing Lead</option>
            <option>JOB-2101 · Product Manager</option>
          </>}
          {target !== 'job' && <>
            <option>— Chọn công ty —</option>
            {Object.keys(PLACEMENT_POS).map((x) => <option key={x}>{x}{target === 'jobs' ? ' · tất cả job đang mở' : ''}</option>)}
          </>}
        </select>
        <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
          Lưu <b className="text-ink/70">ID</b>, không lưu URL — job đổi slug hay công ty đổi tên thì link vẫn đúng.
          {target === 'job' && ' Job đóng thì tự trỏ về job list của công ty đó thay vì báo 404.'}
        </p>
      </div>
    </div>
  )
}
