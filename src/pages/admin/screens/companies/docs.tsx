import { useState } from 'react'
import { useReadOnly } from '@/pages/admin/ctx'
import type { Company } from '@/pages/admin/data/companies'
import { companyDocs } from '@/pages/admin/data/companyOwner'
import type { CoDoc } from '@/pages/admin/data/companyOwner'
import { DetailCard } from '@/pages/admin/ui/fields'

export function CompanyDocs({ c }: { c: Company }) {
  const ro = useReadOnly()
  const [docs, setDocs] = useState<CoDoc[]>(() => companyDocs(c))
  const add = () => setDocs((d) => [...d, { name: `tai-lieu-${d.length + 1}.pdf` }])
  return (
    <DetailCard
      title="Enterprise Registration Documents (ERC)"
      action={<span className="text-[11px] text-faint">{docs.length} tệp</span>}
    >
      <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-4 text-center">
        <p className="text-[12px] font-medium text-ink">{ro ? 'Chỉ xem tài liệu' : <>Kéo thả hoặc <button onClick={add} className="text-brand hover:underline">chọn tệp</button></>}</p>
        <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint"><b className="text-muted">Giấy chứng nhận đăng ký doanh nghiệp (ERC)</b> — nhiều tệp (từng trang, bản sửa đổi) · Giấy chứng nhận đăng ký thuế · Hợp đồng đã ký. PDF, JPG, PNG — tối đa 10MB mỗi tệp.</p>
      </div>
      {docs.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
              <span className="text-[13px]"></span>
              <div className="min-w-0 flex-1">
                <a href="#" onClick={(e) => e.preventDefault()} className="block truncate text-[11.5px] font-medium text-brand hover:underline">{d.name}</a>
                <p className="truncate text-[10px] text-faint">{d.by === 'company' ? 'Employer upload · Company site' : d.by === 'admin' ? 'Admin upload hộ' : ''}{d.note ? `${d.by ? ' · ' : ''}${d.note}` : ''}</p>
              </div>
              {!ro && <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} className="shrink-0 text-[11px] text-faint hover:text-ink">✕</button>}
            </div>
          ))}
        </div>
      )}
      {docs.length > 0 && (
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">Đây là bằng chứng admin đối chiếu khi bấm <b className="text-muted">Verify company</b>: tên pháp lý và MST trên hồ sơ phải khớp giấy này. Employer tự upload ở Company information (Company site); admin upload hộ khi khách gửi qua email. Bản cũ giữ lại cho audit.</p>
      )}
    </DetailCard>
  )
}
