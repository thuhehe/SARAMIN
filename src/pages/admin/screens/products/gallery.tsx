import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GALLERY, GALLERY_TOPICS, INDUSTRY_TOPICS, PENDING_SEED, imgStyle } from '@/pages/admin/data/products'
import type { GalleryImg, PendingFile } from '@/pages/admin/data/products'
import { Pill } from '@/pages/admin/ui/status'

export function AdminImageGallery() {
  /* Two ways in, one classification: pick a topic directly, or pick an industry
     and let the map resolve which topics it prefers. */
  const [topic, setTopic] = useState('')
  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState<'' | 'subject' | 'background'>('')
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [open, setOpen] = useState<GalleryImg | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [uploading, setUploading] = useState(false)

  const mapped = industry ? (INDUSTRY_TOPICS.find(([i]) => i === industry)?.[1] ?? []) : []
  const shown = GALLERY.filter((g) => (showArchived ? true : !g.archived))
    .filter((g) => !topic || g.topics.includes(topic))
    .filter((g) => !industry || g.topics.some((t) => mapped.includes(t)))
    .filter((g) => !role || g.role === role)
    .filter((g) => !q.trim() || (g.title + ' ' + g.tags.join(' ')).toLowerCase().includes(q.trim().toLowerCase()))

  const stock = (t: string) => GALLERY.filter((g) => !g.archived && g.topics.includes(t)).length
  /* a topic under 3 pictures is a topic whose default repeats across the grid */
  const thinTopics = GALLERY_TOPICS.filter((t) => stock(t) < 3)
  /* and the industries that hurts — every topic they map to is thin */
  const thinIndustries = INDUSTRY_TOPICS.filter(([, ts]) => ts.every((t) => stock(t) < 3)).map(([i]) => i)

  return (
    <div>
      <p className="mb-3 max-w-[74ch] text-[11.5px] leading-relaxed text-muted">
        Ảnh dùng cho <b className="text-ink/70">vị trí hiển thị có khung ảnh</b> — tin đăng mượn từ đây khi sản phẩm của
        nó chiếm một placement cần ảnh. Phân loại theo <b className="text-ink/70">chủ đề</b> — thứ duy nhất thuộc về bản
        thân tấm ảnh. Ngành vẫn là lối vào quen thuộc, nhưng đi qua <b className="text-ink/70">bảng ánh xạ ngành → chủ đề</b>,
        nên không tấm ảnh nào phải mang một cái nhãn ngành mà nó không thể chứng minh.
      </p>

      {thinTopics.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
          <b>{thinTopics.length} chủ đề chưa đủ 3 ảnh</b> — {thinTopics.join(' · ')}.
          {thinIndustries.length > 0 && (
            <> Kéo theo <b>{thinIndustries.join(' · ')}</b> không còn ảnh mặc định nào tử tế.</>
          )}
          {' '}Dưới mức này thì ảnh mặc định sẽ lặp lại trên trang chủ, trông tệ hơn cả không bán placement.
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-faint">🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên ảnh, từ khoá…" className="w-[220px] rounded-lg border border-line bg-surface py-1 pl-7 pr-2 text-[11.5px] outline-none focus:border-brand" />
        </div>
        <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', topic ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
          <span className={topic ? 'text-brand/70' : 'text-faint'}>Chủ đề</span>
          <select value={topic} onChange={(e) => { setTopic(e.target.value); setIndustry('') }} className={cn('max-w-[190px] cursor-pointer bg-transparent text-[11.5px] outline-none', topic ? 'font-medium text-brand' : 'text-ink')}>
            <option value="">Tất cả</option>
            {GALLERY_TOPICS.map((t) => <option key={t} value={t}>{t} ({stock(t)})</option>)}
          </select>
        </label>
        <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', industry ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
          <span className={industry ? 'text-brand/70' : 'text-faint'}>Theo ngành</span>
          <select value={industry} onChange={(e) => { setIndustry(e.target.value); setTopic('') }} className={cn('max-w-[190px] cursor-pointer bg-transparent text-[11.5px] outline-none', industry ? 'font-medium text-brand' : 'text-ink')}>
            <option value="">—</option>
            {INDUSTRY_TOPICS.map(([i]) => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <label className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px]', role ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted')}>
          <span className={role ? 'text-brand/70' : 'text-faint'}>Vai trò</span>
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className={cn('cursor-pointer bg-transparent text-[11.5px] outline-none', role ? 'font-medium text-brand' : 'text-ink')}>
            <option value="">Tất cả</option>
            <option value="subject">Chủ thể (cảnh)</option>
            <option value="background">Ảnh nền</option>
          </select>
        </label>
        <button onClick={() => setShowMap((v) => !v)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', showMap ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}>
          Bảng ngành → chủ đề
        </button>
        <button onClick={() => setShowArchived((v) => !v)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', showArchived ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}>
          Hiện cả ảnh đã lưu trữ
        </button>
        <button onClick={() => setUploading(true)} className="ml-auto rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">＋ Tải ảnh lên</button>
      </div>

      {industry && (
        <p className="mb-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-1.5 text-[11px] text-brand">
          <b>{industry}</b> → {mapped.join(' · ')} — ảnh mặc định lấy từ <b>{mapped[0]}</b>, chọn tấm ít dùng nhất trước.
        </p>
      )}

      {showMap && (
        <div className="mb-3 overflow-hidden rounded-xl border border-line">
          <div className="grid grid-cols-[1fr_2fr] gap-x-4 bg-canvas/60 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
            <span>Ngành</span><span>Chủ đề (theo thứ tự ưu tiên)</span>
          </div>
          {INDUSTRY_TOPICS.map(([i, ts]) => (
            <div key={i} className="grid grid-cols-[1fr_2fr] items-center gap-x-4 border-t border-line-soft px-3 py-1.5 text-[11.5px]">
              <span className="truncate">{i}</span>
              <span className="flex flex-wrap gap-1">
                {ts.map((t, n) => (
                  <span key={t} className={cn('rounded-full border px-1.5 py-px text-[10px]', n === 0 ? 'border-brand/30 bg-brand-soft font-medium text-brand' : 'border-line bg-canvas text-muted', stock(t) < 3 && 'border-amber-300 bg-amber-50 text-amber-800')}>
                    {t} · {stock(t)}
                  </span>
                ))}
              </span>
            </div>
          ))}
          <p className="border-t border-line-soft px-3 py-2 text-[10.5px] leading-relaxed text-faint">
            12 dòng × 2–4 chủ đề — một màn hình cấu hình. Chủ đề <b>đầu tiên</b> là nơi ảnh mặc định được lấy ra.
            Thêm hoặc đổi tên một ngành thì sửa đúng một dòng ở đây, thay vì gắn nhãn lại hàng trăm tấm ảnh.
          </p>
        </div>
      )}

      <p className="mb-1.5 text-[11px] text-faint">
        Hiển thị <b className="font-semibold text-ink/70 tabular-nums">{shown.length}</b> / Tổng{' '}
        <b className="font-semibold text-ink/70 tabular-nums">{GALLERY.filter((g) => !g.archived).length}</b> ảnh đang dùng được
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((g) => (
          <button key={g.id} onClick={() => setOpen(g)} className="overflow-hidden rounded-xl border border-line bg-surface text-left transition-colors hover:border-brand">
            <span className="relative block h-[104px]" style={imgStyle(g.hue)}>
              {g.archived && <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Đã lưu trữ</span>}
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white">{g.uses} tin dùng</span>
            </span>
            <span className="block p-2.5">
              <span className="block truncate text-[12px] font-medium text-ink">{g.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1">
                {g.topics.map((t) => (
                  <span key={t} className="rounded-full border border-line bg-canvas px-1.5 py-px text-[10px] text-muted">{t}</span>
                ))}
                {g.role === 'background' && <span className="rounded-full border border-brand/30 bg-brand-soft px-1.5 py-px text-[10px] font-medium text-brand">nền</span>}
              </span>
              {g.expires && (
                <span className="mt-1 block text-[10px] text-faint">Bản quyền đến {g.expires}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {open && <GalleryImageModal img={open} onClose={() => setOpen(null)} />}
      {uploading && <GalleryUploadModal thinTopics={thinTopics} onClose={() => setUploading(false)} />}

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Ảnh phân loại theo <b>chủ đề</b>, không theo ngành: một tấm ảnh là một <b>cảnh</b>, còn ngành là chuyện của
        doanh nghiệp. Nhờ vậy mỗi ảnh chỉ cần 1–2 nhãn thay vì hai mươi, và danh sách ngành có đổi thì chỉ sửa bảng ánh
        xạ. Ảnh <b>không bao giờ bị xoá</b>, chỉ lưu trữ: tin đang chạy vẫn trỏ vào nó.
        Nhà tuyển dụng <b>không tải ảnh lên thư viện này</b> — ảnh họ tự tải chỉ nằm trên tin của họ, vì mình không có
        quyền phát hành lại ảnh đó cho công ty khác.
      </p>
    </div>
  )
}

function GalleryUploadModal({ thinTopics, onClose }: { thinTopics: string[]; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [files, setFiles] = useState<PendingFile[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [role, setRole] = useState<'subject' | 'background'>('subject')
  const [source, setSource] = useState('')
  const [licence, setLicence] = useState('')
  const [expires, setExpires] = useState('')

  /* PER-IMAGE topics, keyed by file name. A batch is rarely all one thing — this
     drop alone is warehouse, meeting, engineer and clinic — so the topic field
     lives on the ROW, and the chips in step 2 are only a bulk shortcut into it. */
  const [perFile, setPerFile] = useState<Record<string, string[]>>({})

  const accepted = files.filter((f) => f.ok)
  const rejected = files.filter((f) => !f.ok)
  const topicsFor = (name: string) => perFile[name] ?? topics
  const togglePerFile = (name: string, t: string) =>
    setPerFile((p) => {
      const cur = p[name] ?? topics
      return { ...p, [name]: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] }
    })
  const toggleTopic = (t: string) => setTopics((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
  /* every accepted picture needs a topic — an untagged one can never be found in
     the picker and can never be an industry's default */
  const untagged = accepted.filter((f) => topicsFor(f.name).length === 0)
  /* licence and source are what make a picture publishable — the classification can
     be corrected later, an unlicensed photo on a paid placement cannot */
  const ready = accepted.length > 0 && untagged.length === 0 && source.trim() !== '' && licence !== ''
  /* how much of the coverage gap this batch actually closes */
  const fixes = [...new Set(accepted.flatMap((f) => topicsFor(f.name)))].filter((t) => thinTopics.includes(t))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[720px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tải ảnh lên thư viện</p>
            <p className="text-[11px] text-muted">
              <span className={cn(step === 1 ? 'font-semibold text-brand' : '')}>1 · Chọn tệp</span>
              <span className="mx-1.5 text-faint">→</span>
              <span className={cn(step === 2 ? 'font-semibold text-brand' : '')}>2 · Phân loại cả lô</span>
            </p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        {step === 1 ? (
          <div className="p-5">
            <button
              onClick={() => setFiles(PENDING_SEED)}
              className="grid w-full place-items-center gap-1 rounded-xl border-2 border-dashed border-line bg-canvas/40 px-4 py-8 text-center hover:border-brand hover:bg-brand-soft/40"
            >
              <span className="text-[22px]">🖼️</span>
              <span className="text-[13px] font-semibold text-ink">Kéo thả ảnh vào đây, hoặc bấm để chọn tệp</span>
              <span className="text-[11px] text-muted">JPG · PNG · WebP — tối thiểu <b>1600 × 1200</b>, chọn nhiều tệp một lúc</span>
            </button>

            {files.length > 0 && (
              <>
                <div className="mt-3 space-y-1.5">
                  {files.map((f, i) => (
                    <div key={f.name} className={cn('flex items-center gap-2.5 rounded-lg border px-2.5 py-2', f.ok ? 'border-line' : 'border-rose-200 bg-rose-50')}>
                      <span className="h-9 w-12 shrink-0 rounded" style={imgStyle(f.hue)} />
                      <span className="min-w-0 flex-1">
                        {f.ok ? (
                          <input
                            value={f.title}
                            onChange={(e) => setFiles((p) => p.map((x, n) => (n === i ? { ...x, title: e.target.value } : x)))}
                            className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[12.5px] font-medium text-ink outline-none hover:border-line focus:border-brand"
                          />
                        ) : (
                          <span className="block px-1 text-[12.5px] font-medium text-rose-700">{f.name}</span>
                        )}
                        <span className="block px-1 font-mono text-[10.5px] text-faint">{f.name} · {f.w}×{f.h}</span>
                      </span>
                      {/* Topics belong on the ROW: a drop is rarely one subject — this
                          batch alone is warehouse, meeting, engineer and clinic. Multi-select,
                          because one picture can honestly be two topics. */}
                      {f.ok && (
                        <span className="flex min-w-[190px] max-w-[240px] shrink-0 flex-wrap items-center gap-1">
                          {topicsFor(f.name).map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand bg-brand-soft px-1.5 py-px text-[10px] font-medium text-brand">
                              {t}
                              <button onClick={() => togglePerFile(f.name, t)} className="text-brand/60 hover:text-brand">✕</button>
                            </span>
                          ))}
                          <select
                            value=""
                            onChange={(e) => e.target.value && togglePerFile(f.name, e.target.value)}
                            className={cn(
                              'cursor-pointer rounded-full border border-dashed bg-surface px-1.5 py-px text-[10px] outline-none hover:border-ink/30',
                              topicsFor(f.name).length === 0 ? 'border-amber-300 text-amber-700' : 'border-line text-muted',
                            )}
                          >
                            <option value="">{topicsFor(f.name).length === 0 ? 'Chọn chủ đề…' : '＋ chủ đề'}</option>
                            {GALLERY_TOPICS.filter((t) => !topicsFor(f.name).includes(t)).map((t) => (
                              <option key={t} value={t}>{t}{thinTopics.includes(t) ? ' ▲' : ''}</option>
                            ))}
                          </select>
                        </span>
                      )}
                      {f.ok
                        ? <Pill tone="active">Đạt</Pill>
                        : <span title="Ảnh nhỏ hơn 1600×1200 — bị từ chối ngay, không phóng to" className="shrink-0"><Pill tone="rejected">Quá nhỏ</Pill></span>}
                      <button onClick={() => setFiles((p) => p.filter((_, n) => n !== i))} className="shrink-0 text-[11px] text-faint hover:text-ink">✕</button>
                    </div>
                  ))}
                </div>
                {rejected.length > 0 && (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-800">
                    <b>{rejected.length} tệp bị từ chối</b> vì nhỏ hơn 1600×1200. Ảnh phải cắt được cho cả khung dọc 3:4 lẫn
                    ngang 3:2 — phóng to một ảnh nhỏ chỉ chuyển vấn đề sang trang chủ.
                  </p>
                )}
                <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
                  Tên ảnh sửa được ngay ở đây — đây là chuỗi mà ô tìm kiếm sẽ khớp, không phải tên tệp.
                  <b className="text-ink/70"> Chủ đề đặt trên từng ảnh</b> (chọn nhiều được), vì một lô thả vào hiếm khi cùng một
                  cảnh — chính lô này đã là kho vận · họp nhóm · kỹ thuật · y tế. ▲ là chủ đề đang thiếu ảnh.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-5">
            <p className="mb-3 rounded-lg border border-brand/25 bg-brand-soft px-3 py-2 text-[11.5px] text-brand">
              Áp cho cả <b>{accepted.length} ảnh</b> vừa chọn. Sửa riêng từng tấm sau, ở màn chi tiết.
            </p>

            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Gắn nhanh cho cả lô — ảnh cho thấy cái gì</p>
            <div className="flex flex-wrap gap-1.5">
              {GALLERY_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => { toggleTopic(t); setPerFile((p) => Object.fromEntries(accepted.map((f) => { const cur = p[f.name] ?? []; return [f.name, cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]] })) )}}
                  className={cn('rounded-full border px-2.5 py-1 text-[11.5px]', topics.includes(t) ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}
                >
                  {t}
                  {thinTopics.includes(t) && <span className="ml-1 text-[10px] text-amber-600" title="Chủ đề đang thiếu ảnh">▲</span>}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
              Bấm một chủ đề ở đây là <b>gắn cho cả {accepted.length} ảnh</b> — tiện khi cả gói stock cùng một cảnh.
              Khác nhau thì sửa từng ảnh ở bước 1. ▲ là chủ đề chưa đủ 3 ảnh — thêm vào đó là vá đúng chỗ đang thủng.
            </p>

            {/* One place sets a topic — the row in step 1. Here we only report what
                came back from it, because the same field edited in two screens is the
                fastest way to make two answers. */}
            <div className="mt-2 rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11px] leading-relaxed text-muted">
              Chủ đề đã đặt trên từng ảnh ở bước 1: {' '}
              {[...new Set(accepted.flatMap((f) => topicsFor(f.name)))].length === 0
                ? <b className="text-amber-700">chưa ảnh nào có chủ đề</b>
                : <b className="text-ink/70">{[...new Set(accepted.flatMap((f) => topicsFor(f.name)))].join(' · ')}</b>}
              {accepted.some((f) => topicsFor(f.name).length === 0) && (
                <span className="text-amber-700"> — còn {accepted.filter((f) => topicsFor(f.name).length === 0).length} ảnh chưa gắn, quay lại bước 1 để bổ sung.</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Vai trò <span className="text-rose-500">*</span></p>
                <div className="flex gap-1.5">
                  {([['subject', 'Chủ thể (cảnh)'], ['background', 'Ảnh nền']] as const).map(([k, l]) => (
                    <button key={k} onClick={() => setRole(k)} className={cn('flex-1 rounded-lg border px-2.5 py-1.5 text-[11.5px]', role === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}>{l}</button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
                  Khung hero 2 ảnh cần <b>một nền + một chủ thể</b>; hai chủ thể cạnh nhau là hai tấm ảnh đánh nhau.
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Bản quyền <span className="text-rose-500">*</span></p>
                <select value={licence} onChange={(e) => setLicence(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-brand">
                  <option value="">— chọn —</option>
                  <option>Stock · thuê bao (có hạn)</option>
                  <option>Stock · mua vĩnh viễn</option>
                  <option>Nội bộ · Saramin chụp</option>
                  <option>Khách hàng cấp quyền</option>
                </select>
                {licence.includes('có hạn') && (
                  <input value={expires} onChange={(e) => setExpires(e.target.value)} placeholder="Hết hạn — dd/mm/yyyy" className="mt-1.5 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-brand" />
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Nguồn <span className="text-rose-500">*</span></p>
              <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Shutterstock · pack #4821 · hoặc: shoot nội bộ 08/2026" className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-brand" />
              <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
                Nguồn và bản quyền là <b>bắt buộc</b>: một tấm ảnh không rõ quyền nằm trên placement khách đã trả tiền là
                rủi ro pháp lý, và khi thuê bao hết hạn thì đây là thứ duy nhất giúp tìm ra hết những gì phải gỡ.
              </p>
            </div>

            {fixes.length > 0 && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
                Lô này bổ sung cho <b>{fixes.join(' · ')}</b> — {accepted.length} ảnh, đủ đưa chủ đề qua ngưỡng 3 ảnh.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <span className="text-[11px] text-faint">
            {files.length === 0 ? 'Chưa chọn tệp nào' : `${accepted.length} ảnh hợp lệ${rejected.length ? ` · ${rejected.length} bị loại` : ''}`}
          </span>
          <div className="flex gap-2">
            <button onClick={step === 1 ? onClose : () => setStep(1)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">
              {step === 1 ? 'Huỷ' : '← Quay lại'}
            </button>
            {step === 1 ? (
              <button disabled={accepted.length === 0} onClick={() => setStep(2)} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                Tiếp tục · phân loại →
              </button>
            ) : (
              <button disabled={!ready} onClick={onClose} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                Thêm {accepted.length} ảnh vào thư viện
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** One picture: how it crops into each placement frame, and what it is licensed for. */
function GalleryImageModal({ img, onClose }: { img: GalleryImg; onClose: () => void }) {
  /* the frames the site actually paints — the aspect comes from the placement row */
  const FRAMES = [
    { label: 'Thẻ nhỏ (lưới platinum)', ratio: '596 × 258', cls: 'h-[86px] w-[199px]' },
    { label: 'Thẻ lớn (hero)', ratio: '600 × 1120', cls: 'h-[187px] w-[100px]' },
    { label: 'Ô vuông (mobile)', ratio: '1:1', cls: 'h-[120px] w-[120px]' },
  ]
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-[640px] rounded-xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-bold">{img.title}</p>
            <p className="text-[11px] text-muted">{img.licence}{img.expires ? ` · đến ${img.expires}` : ''} · đang được {img.uses} tin dùng</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>
        <div className="p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Cắt theo từng khung — một ảnh gốc, không cắt sẵn</p>
          <div className="flex flex-wrap items-end gap-3">
            {FRAMES.map((f) => (
              <div key={f.ratio}>
                <div className={cn('relative overflow-hidden rounded-lg border border-line', f.cls)} style={imgStyle(img.hue)}>
                  {/* safe areas the card paints its own furniture into */}
                  <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">badge</span>
                  <span className="absolute right-1 top-1 text-[11px] text-white/90">☆</span>
                  <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand" title="Focal point" />
                </div>
                <p className="mt-1 text-[10.5px] text-muted">{f.label} · {f.ratio}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            Chấm xanh là <b>focal point</b> — điểm mọi khung cắt phải giữ lại. Lưu <b>một ảnh gốc ≥1600×1200</b> rồi cắt
            theo tỉ lệ lúc render; cắt sẵn từng khung thì mỗi lần thêm một kích thước mới (bản mobile chẳng hạn) là phải
            cắt lại cả thư viện bằng tay. Ô <i>badge</i> và dấu ☆ là vùng thẻ tự vẽ đè lên — chủ thể không được nằm ở đó.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {img.topics.map((t) => <span key={t} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] text-muted">{t}</span>)}
            <span className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] text-muted">{img.role === 'background' ? 'Ảnh nền' : 'Chủ thể (cảnh)'}</span>
            {img.tags.map((t) => <span key={t} className="rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">#{t}</span>)}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Close</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Lưu trữ</button>
          <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  )
}
