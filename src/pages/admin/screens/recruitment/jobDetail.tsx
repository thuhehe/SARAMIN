import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BenefitCards } from '@/components/BenefitsField'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { JOB_SAVERS } from '@/pages/admin/data/jobForm'
import type { JobRow } from '@/pages/admin/data/recruitment'
import { DetailCard, KV, Section } from '@/pages/admin/ui/fields'
import { MiniStat } from '@/pages/admin/ui/stats'
import { Pill } from '@/pages/admin/ui/status'
import { Table } from '@/pages/admin/ui/table'

/** KV row with a read-only "shown to jobseekers" toggle on the right — mirrors the create form's Show-to-Jobseekers switch. */
function KVShow({ label, value, shown }: { label: string; value: string; shown: boolean }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] uppercase tracking-wide text-faint">{label}</p>
        <span className="inline-flex shrink-0 items-center gap-1 text-[9.5px] text-muted">
          <span className={cn('relative h-3.5 w-6 rounded-full', shown ? 'bg-emerald-500' : 'bg-line')}>
            <span className={cn('absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white', shown ? 'left-[11px]' : 'left-0.5')} />
          </span>
          {shown ? 'Shown' : 'Hidden'}
        </span>
      </div>
      <p className="mt-0.5 text-[12.5px] text-ink/85">{value}</p>
    </div>
  )
}

function SavedByCard({ job }: { job: JobRow }) {
  const [open, setOpen] = useState(false)
  if (!job.saves) {
    return (
      <DetailCard title="Saved by" action={<span className="text-[11px] text-faint">0 jobseekers</span>}>
        <p className="text-[12px] text-muted">Chưa có ai lưu tin này.</p>
      </DetailCard>
    )
  }
  const shown = open ? JOB_SAVERS : JOB_SAVERS.slice(0, 3)
  return (
    <DetailCard title="Saved by" action={<span className="text-[11px] text-faint">{job.saves.toLocaleString('en-US')} jobseekers</span>}>
      <Table
        minW={520}
        cols={[{ label: 'Jobseeker', w: '1.6fr' }, { label: 'Location', w: '0.9fr' }, { label: 'Saved', w: '0.9fr' }, { label: 'Applied?', w: '0.7fr', align: 'r' }]}
        rows={shown.map((s) => [
          <div className="min-w-0">
            <button className="truncate text-left text-[12.5px] font-medium text-brand hover:underline">{s.name}</button>
            <p className="truncate text-[10.5px] text-faint">{s.title} · {s.exp}</p>
          </div>,
          <span className="truncate text-muted">{s.location}</span>,
          <span className="text-muted">{s.when}</span>,
          s.applied
            ? <Pill tone="active">Đã ứng tuyển</Pill>
            : <span className="text-[11.5px] text-faint">—</span>,
        ])}
      />
      {job.saves > 3 && (
        <button onClick={() => setOpen((o) => !o)} className="mt-2 text-[11.5px] font-medium text-brand hover:underline">
          {open ? 'Thu gọn' : `Xem tất cả ${job.saves.toLocaleString('en-US')} người đã lưu →`}
        </button>
      )}
      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
        Tên ứng viên là PII — mở hồ sơ từ đây được ghi vào audit log, và chỉ hiện với người có quyền xem ứng viên.
      </p>
    </DetailCard>
  )
}

export function AdminJobDetail({ job, onBack }: { job: JobRow; onBack: () => void }) {
  useDetailCrumb(job.title, onBack)
  /* The employer's title-edit window is 72 HOURS from publishedAt — counted in
     hours, not calendar days. Shown here because HQ needs to know the employer can
     no longer fix it themselves; Admin itself is NOT restricted on any field. */
  const hoursLive = (() => {
    const m = job.posted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!m || job.status !== 'open') return null
    const posted = new Date(+m[3], +m[2] - 1, +m[1])
    return Math.floor((Date.now() - posted.getTime()) / 3_600_000)
  })()
  const titleLocked = hoursLive !== null && hoursLive > 72
  return (
    <div className="max-w-[900px]">

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{job.title} <Pill tone={job.status}>{job.statusLabel}</Pill></h2>
          <p className="text-[11.5px] text-muted"><span className="font-mono">{job.id}</span> · {job.category} · {job.company} · Created by {job.source}</p>
          {hoursLive !== null && (
            <p className={cn('mt-1 text-[10.5px]', titleLocked ? 'text-amber-700' : 'text-muted')}>
              {titleLocked
                ? `🔒 Tiêu đề đã khoá với employer — tin đã đăng ${hoursLive} giờ (khoá sau 72 giờ). Admin vẫn sửa được mọi trường.`
                : `Employer còn ${72 - hoursLive} giờ để sửa tiêu đề (72 giờ kể từ khi đăng). Admin không bị giới hạn.`}
            </p>
          )}
          <a className="mt-1 inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-brand hover:underline">
            {job.status === 'draft' || job.status === 'schedule'
              ? 'Preview draft ↗'
              : job.status === 'open'
                ? 'View live job post ↗'
                : 'View job post (closed) ↗'}
          </a>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Duplicate</button>
          <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Edit</button>
          {job.status === 'open' && <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Close</button>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <MiniStat label="Applicants" value={job.applicants || '—'} />
        <MiniStat label="Views" value={job.views.toLocaleString('en-US')} />
        <MiniStat label="Saves" value={job.saves.toLocaleString('en-US')} />
        <MiniStat label="Created by" value={job.source} />
        <MiniStat label="Posted" value={job.posted} />
        <MiniStat label="Expires" value={job.deadline} />
        <MiniStat label="Status" value={job.statusLabel} tone={job.status === 'schedule' ? 'warn' : undefined} />
      </div>

      {/* Full read-only field view — mirrors the Create job form, grouped the same way */}
      <div className="space-y-4">
        <DetailCard title="Posting setup">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KV label="Company" value={`${job.company} · CO-1042`} link />
            <KV label="Purchase order (PO)" value={job.product === 'Free' ? '— none (Free job)' : 'PO-2026-0042 · active'} link={job.product !== 'Free'} />
            <KV label="Products" value={`Job Posting — ${job.product}`} />
            <KV label="Exposure" value={job.status === 'open' ? 'On — visible on the jobseeker site' : '— (only meaningful while Open)'} />
            <KV label="Created by" value={job.source === 'Admin' ? 'Admin — HQ on the company’s behalf' : 'Company HR'} />
          </div>
        </DetailCard>

        <DetailCard title="Job information">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KV label="Job title (VI)" value="Trưởng nhóm kỹ thuật (.NET, tiếng Nhật N4+)" />
            <KV label="Job title (EN)" value="Technical Leader / Technical Architect (.NET)" />
            <KV label="Job category" value={job.category} />
            <KV label="Job role" value="Software Developer" />
            <KV label="Job level" value="Experienced (non-manager)" />
            <KV label="Work type" value="In office" />
            <KV label="Contract type" value="Fulltime" />
            <KV label="Industry" value="FMCG" />
            <KV label="Skills" value="ASP.NET Core · .NET · React" />
            <KV label="Location (province / city)" value="Hồ Chí Minh" />
            <KV label="Address" value="Burning Bros D2 · 69 Võ Nguyên Giáp, Thảo Điền, Quận 2" />
            <KVShow label="Salary" value="500 – 1,500 USD / month" shown />
            <KVShow label="Number of headcount" value="1" shown={false} />
            <KV label="Contact person" value="Ms. Vũ Thanh Linh · HR Manager" />
            <KV label="Application recipient email(s)" value="hr@nec.vn · ta.lead@nec.vn" />
            <KV label="Expires" value={`${job.deadline} — from product duration`} />
          </div>
        </DetailCard>

        <DetailCard title="Job content">
          <Section title="Job description" />
          <p className="text-[12px] leading-relaxed text-muted">Lead the development team; backend architecture (70%) + frontend (30%); code review &amp; mentoring…</p>
          <Section title="Requirements" className="mt-2" />
          <p className="text-[12px] leading-relaxed text-muted">7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…</p>
          {/* ONE list — the job's own. It STARTED as a copy of the company set and
              was then curated for the position; the company page stays one click
              away for the full default set. */}
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <Section title="Phúc lợi" className="mt-0" />
            <a className="cursor-pointer text-[10.5px] font-medium text-brand hover:underline">Xem full phúc lợi công ty ↗</a>
          </div>
          <BenefitCards items={[
            { key: 'bonus', text: 'Thưởng dự án theo milestone, xét tăng lương 2 lần/năm' },
            { key: 'insurance', text: 'BHXH – BHYT – BHTN đóng đầy đủ theo lương' },
            { key: 'remote-support', text: 'Hybrid 2 ngày/tuần, giờ vào ca linh hoạt 8–10h' },
            { key: 'training', text: 'Tài khoản Udemy + ngân sách đào tạo, lộ trình thăng tiến rõ' },
            { key: 'paid-leave', text: '19+ ngày phép/năm' },
            { key: 'stock-esop', text: 'ESOP cho kỹ sư gắn bó từ 1 năm' },
          ]} />
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
            Danh sách của riêng tin này — được <b className="text-ink/70">điền sẵn từ bộ phúc lợi công ty</b> lúc tạo, rồi chỉnh cho vị trí
            (Edit có nút “↺ Về mặc định công ty”). Sửa trang công ty không tự đổi tin đã đăng.
            Nhãn loại phúc lợi song ngữ lấy từ Master data; mô tả tiếng Việt bắt buộc, EN/KO tuỳ chọn.
          </p>
        </DetailCard>

        <DetailCard title="Candidate expectation">
          <div className="grid gap-x-6 sm:grid-cols-2">
            <KV label="Years of experience (min – max)" value="3 – 7 years" />
            <KV label="Minimum education level" value="Bachelor" />
            <KVShow label="Nationality" value="Any" shown={false} />
            <KVShow label="Gender" value="Any" shown={false} />
            <KVShow label="Marital status" value="Any" shown={false} />
            <KVShow label="Age preference" value="18 – 60" shown={false} />
            <KV label="Cover letter" value="Never required" />
          </div>
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-amber-800">Demographic fields (nationality / gender / marital status / age) are legally sensitive for VN job ads — pending client confirmation.</p>
        </DetailCard>

        <SavedByCard job={job} />

        <DetailCard title="Internal (HQ only)">
          <p className="text-[12px] leading-relaxed text-muted">Approval context, special instructions, follow-ups… — never shown publicly.</p>
        </DetailCard>
      </div>

      {job.status === 'open' && <p className="mt-3 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] text-muted">This job is live on the jobseeker site. Turn Exposure off to take it down without closing it — or Close to end it.</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-faint">Read-only view — mirrors the Create job fields. Real values load from the saved job record; use Edit to change them.</p>
    </div>
  )
}
