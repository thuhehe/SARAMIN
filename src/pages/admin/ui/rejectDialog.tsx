import { useState } from 'react'
import { cn } from '@/lib/utils'
import { REASON_DRAFTS, REJECT_CTAS, REJECT_REASONS, REJECT_TAG } from '@/pages/admin/data/recruitment'

/* ── The reject dialog ─────────────────────────────────────────────────────
 *
 * One decision, asked in the order it is actually made: WHY (internal), then WHAT
 * THE CANDIDATE GETS, then the note for us. It is a dialog rather than a menu
 * because the middle block is outbound writing — a reviewer has to be able to
 * READ the sentence a stranger will receive before sending it, and a 360px
 * dropdown does not let them.
 *
 * The reason list shows each code's DRAFT underneath it, so picking is never
 * blind: the code is chosen for what it will SAY, not for what it is called.
 * "Khác" shows no draft, which is the visible form of the rule that it has to be
 * written by hand.
 *
 * The TAG is rendered read-only, on purpose. It is the same for every reason and
 * it is not the reviewer's to choose — showing it as an editable field would
 * invite a per-case tag, which is exactly the coupling this design removed.
 */
export function RejectDialog({ name, file, extracted, apps, ver, sent, sentOld, onClose }: { name: string; file: string; extracted?: string; apps?: number; ver?: number; sent?: number; sentOld?: number; onClose: () => void }) {
  const [reason, setReason] = useState<string>(REJECT_REASONS[2])
  const draft = REASON_DRAFTS[reason]
  /* THE THREE OUTCOMES OF ONE REJECT, computed rather than assumed — see the
     CvCheckRow comment. `kept` is the number that made this block necessary: the
     old copy promised to recall every sent application, which punished employers
     for an edit the candidate made after delivery. */
  const nSent = sent ?? 0
  const kept = sentOld ?? 0
  const recalled = Math.max(0, nSent - kept)
  const held = Math.max(0, (apps ?? 0) - nSent)
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[640px] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-start justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">Từ chối CV — {name}</p>
            <p className="truncate text-[11px] text-muted">{file}{extracted ? ` · ${extracted}` : ''}</p>
          </div>
          <span className="cursor-pointer pl-3 text-faint" onClick={onClose}>✕</span>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-faint">
              Lý do <span className="font-normal text-rose-500">*bắt buộc</span>
              <span className="ml-1 font-normal normal-case tracking-normal">— nội bộ, ứng viên không thấy</span>
            </p>
            <div className="overflow-hidden rounded-lg border border-line">
              {REJECT_REASONS.map((rr) => (
                <button
                  key={rr}
                  onClick={() => setReason(rr)}
                  className={cn('flex w-full items-start gap-2 border-b border-line-soft px-2.5 py-2 text-left last:border-b-0', reason === rr ? 'bg-rose-50/70' : 'hover:bg-canvas/60')}
                >
                  <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', reason === rr ? 'border-rose-500' : 'border-line')}>
                    {reason === rr && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[12px]', reason === rr ? 'font-semibold text-ink' : 'text-ink/85')}>{rr}</span>
                    <span className="block text-[10px] leading-snug text-faint">
                      {REASON_DRAFTS[rr].msg ? `Soạn sẵn: “${REASON_DRAFTS[rr].msg}”` : 'Không soạn sẵn — bạn phải tự viết lời nhắn'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── everything in this block reaches the candidate ─────────────── */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-800">Ứng viên nhìn thấy phần này</p>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="shrink-0 text-[10.5px] text-amber-800/70">Tag</span>
              <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-medium text-rose-600">{REJECT_TAG}</span>
              <span className="text-[10px] text-amber-800/60">tự động — mọi lý do đều dùng tag này</span>
            </div>
            <p className="mb-1 flex items-baseline justify-between text-[10px] font-bold uppercase tracking-wide text-amber-800/80">
              <span>Lời nhắn <span className="font-normal text-rose-500">*bắt buộc</span></span>
              <span className="font-normal normal-case tracking-normal text-amber-800/60">{draft.msg.length} / 300</span>
            </p>
            <div className={cn('min-h-[54px] rounded-md border border-amber-200 bg-surface px-2 py-1.5 text-[11.5px] leading-relaxed', draft.msg ? 'text-ink' : 'italic text-faint')}>
              {draft.msg || 'Chưa có nội dung — viết lời nhắn cho ứng viên…'}
            </div>
            <p className="mt-1 text-[10px] text-amber-800/60">
              {draft.msg ? 'Soạn sẵn theo lý do đã chọn — sửa thoải mái.' : '“Khác” không soạn sẵn: tag chung mà không có lời nhắn thì ứng viên không biết phải sửa gì.'}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="shrink-0 text-[10.5px] text-amber-800/70">Nút</span>
              <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-surface px-1.5 py-0.5 text-[10.5px] text-ink">{draft.cta} ▾</span>
              <span className="text-[10px] text-amber-800/60">{REJECT_CTAS.length} lựa chọn</span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">
              Ghi chú nội bộ <span className="font-normal text-rose-500">*bắt buộc</span>
              <span className="ml-1 font-normal normal-case tracking-normal">— chỉ admin đọc</span>
            </p>
            <div className="h-14 rounded-md border border-line bg-canvas/40" />
          </div>

          {/* ── WHAT THIS REJECT DOES, PER VERSION ────────────────────────────
              The reviewer is deciding on ONE version of the document, and the
              applications behind it do not all carry that version. Printing a
              single "everything gets recalled" line was wrong AND unfalsifiable —
              a reviewer could not see that they were about to pull back a CV an
              employer received months ago and had no complaint about.

              So the block states the three outcomes separately and names the
              version each group holds. The KEPT row is the one worth reading
              twice: it is green, because leaving those alone is the correct
              result, not a limitation. */}
          {!!apps && apps > 0 && (
            <div className="rounded-lg border border-line">
              <p className="flex items-baseline justify-between gap-2 border-b border-line-soft px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-faint">
                <span>Quyết định này ảnh hưởng {apps} đơn</span>
                {!!ver && <span className="font-normal normal-case tracking-normal text-ink/70">Đang từ chối <b className="font-semibold">bản {ver}</b> — bản mới nhất</span>}
              </p>
              <div className="divide-y divide-line-soft">
                {held > 0 && (
                  <p className="flex items-baseline gap-2 px-2.5 py-1.5 text-[11.5px] leading-snug text-ink">
                    <span className="shrink-0 text-amber-600">⚠</span>
                    <span className="flex-1"><b className="font-semibold">{held} đơn đang chờ</b> <span className="text-faint">— chưa tới NTD</span></span>
                    <span className="shrink-0 font-semibold text-amber-700">Không được gửi</span>
                  </p>
                )}
                {recalled > 0 && (
                  <p className="flex items-baseline gap-2 px-2.5 py-1.5 text-[11.5px] leading-snug text-ink">
                    <span className="shrink-0 text-rose-500">⚠</span>
                    <span className="flex-1"><b className="font-semibold">{recalled} đơn đã gửi</b> <span className="text-faint">— mang đúng bản {ver ?? '—'}</span></span>
                    <span className="shrink-0 font-semibold text-rose-600">Thu hồi</span>
                  </p>
                )}
                {kept > 0 && (
                  <p className="flex items-baseline gap-2 bg-emerald-50/50 px-2.5 py-1.5 text-[11.5px] leading-snug text-ink">
                    <span className="shrink-0 text-emerald-600">✓</span>
                    <span className="flex-1"><b className="font-semibold">{kept} đơn đã gửi</b> <span className="text-faint">— mang bản cũ hơn</span></span>
                    <span className="shrink-0 font-semibold text-emerald-700">Giữ nguyên</span>
                  </p>
                )}
              </div>
              <p className="border-t border-line-soft px-2.5 py-1.5 text-[10px] leading-snug text-faint">
                {kept > 0
                  ? 'Một đơn chỉ bị thu hồi khi nó mang đúng bản đang bị từ chối. NTD nhận bản cũ đã nhận một tài liệu khác — không lấy lại của họ vì một thay đổi xảy ra sau đó.'
                  : 'Một đơn chỉ bị thu hồi khi nó mang đúng bản đang bị từ chối. Ở CV này mọi đơn đã gửi đều mang bản đó.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="max-w-[300px] text-[10.5px] leading-snug text-faint">Quyết định áp lên CV, không lên từng đơn — nhưng chỉ chạm vào đơn mang bản đang bị từ chối.</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink hover:bg-canvas">Huỷ</button>
            <button onClick={onClose} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-rose-700">Từ chối CV</button>
          </div>
        </div>
      </div>
    </div>
  )
}
