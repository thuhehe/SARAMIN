/*
 * Logo frame + zoom.
 *
 * ONE uploaded asset has to survive two very different frames, and the Figma gives
 * both of them exactly:
 *
 *   · 210 × 86  — the company detail sidebar   (Figma "Company detail", 228:271)
 *   ·  96 × 96  — the job card on the homepage (Figma "New Saramin VN", 143:463,
 *                 artwork inset 10px on every side)
 *
 * So a logo can never be stored "at a size". It is stored once at high resolution
 * and CONTAIN-FITTED into whichever frame is rendering — otherwise a wide wordmark
 * (Samsung is roughly 5:1) and a square badge cannot both look right in a 96×96 box.
 *
 * Contain-fit alone is still not enough, which is why the zoom exists. Fitted to the
 * same box, a wide wordmark ends up visually tiny (its height is a fifth of its
 * width) while a square badge fills the frame and reads as shouting. Every logo
 * needs a nudge, and nobody can judge that nudge on one logo alone — hence the
 * comparison row: the operator sets the size while looking at it NEXT TO other
 * companies, which is exactly how a jobseeker will see it on a list page.
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Real frames, straight from the two Figma pages. */
export const LOGO_FRAMES = {
  detail: { w: 210, h: 86, pad: 12, label: 'Trang công ty — cột trái', figma: '228:271' },
  card: { w: 96, h: 96, pad: 10, label: 'Thẻ việc làm · danh sách', figma: '143:463' },
} as const

/** What an upload has to be for both frames to stay sharp. 186px of usable width in
    the detail frame at 2× DPR needs 372px, so 400 is the floor and 800 the advice. */
export const LOGO_UPLOAD = {
  min: 400,
  recommended: 800,
  maxMB: 2,
  formats: 'PNG (nền trong suốt) hoặc SVG',
}

export const ZOOM_MIN = 60
export const ZOOM_MAX = 130

/* Stand-in wordmarks for the comparison row. Deliberately NOT real brand artwork —
   this is a wireframe, and the point is the SHAPE (how wide the mark is relative to
   its height), which is what makes one logo read bigger than another. */
const PEERS = [
  { name: 'SAMSUNG', ratio: 5.4, weight: 800, spacing: '0.04em' },
  { name: 'Viettel', ratio: 3.0, weight: 700, spacing: '0' },
  { name: 'VNG', ratio: 1.7, weight: 800, spacing: '0.02em' },
  { name: 'FPT', ratio: 1.6, weight: 800, spacing: '0' },
  { name: 'Vingroup', ratio: 4.2, weight: 600, spacing: '0.02em' },
  { name: 'Shopee', ratio: 3.4, weight: 700, spacing: '0' },
]

/** One logo inside one frame, contain-fitted, at `zoom`%. */
function LogoInFrame({
  frame, text, ratio, zoom = 100, weight = 700, spacing = '0', tone = 'brand', showBox,
}: {
  frame: keyof typeof LOGO_FRAMES
  text: string
  /** width ÷ height of the artwork — what decides how contain-fit lands */
  ratio: number
  zoom?: number
  weight?: number
  spacing?: string
  tone?: 'brand' | 'muted'
  showBox?: boolean
}) {
  const f = LOGO_FRAMES[frame]
  const availW = f.w - f.pad * 2
  const availH = f.h - f.pad * 2
  // contain: whichever axis runs out first decides the scale
  const fit = Math.min(availW, availH * ratio)
  /* Above 100% the artwork starts eating the padding, which is fine — padding is a
     cushion, not a boundary. What is NOT fine is passing the frame itself: that
     crops the logo, and a cropped logo is always wrong. So it hard-stops at the
     frame edge and the UI says so rather than silently clipping. */
  const drawnW = Math.min(fit * (zoom / 100), f.w, f.h * ratio)
  const drawnH = drawnW / ratio
  const clamped = drawnW < fit * (zoom / 100) - 0.5
  return (
    <div
      className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-md border bg-white', showBox ? 'border-line' : 'border-transparent')}
      style={{ width: f.w, height: f.h }}
    >
      {showBox && (
        <span className="pointer-events-none absolute rounded-sm border border-dashed border-brand/25" style={{ inset: f.pad }} />
      )}
      {showBox && clamped && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-amber-500/85 py-px text-center text-[8.5px] font-semibold text-white">chạm mép khung</span>
      )}
      <span
        className={cn('grid place-items-center overflow-hidden whitespace-nowrap', tone === 'brand' ? 'text-brand' : 'text-slate-700')}
        style={{ width: drawnW, height: drawnH, fontSize: drawnH * 0.72, fontWeight: weight, letterSpacing: spacing, lineHeight: 1 }}
      >
        {text}
      </span>
    </div>
  )
}

export function LogoSizer({ company, initialZoom = 100 }: { company: string; initialZoom?: number }) {
  const [zoom, setZoom] = useState(initialZoom)
  const [uploaded, setUploaded] = useState(true)
  /* Aspect ratio of the uploaded artwork — real code reads this off the file. */
  const ratio = 3.2
  const short = company.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '')

  if (!uploaded) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-6 text-center">
        <p className="text-[12px] font-medium text-ink">Chưa có logo</p>
        <p className="mx-auto mt-1 max-w-[46ch] text-[11px] leading-relaxed text-muted">
          {LOGO_UPLOAD.formats} · cạnh dài tối thiểu <b className="text-ink/70">{LOGO_UPLOAD.min}px</b> (nên ≥ {LOGO_UPLOAD.recommended}px) · tối đa {LOGO_UPLOAD.maxMB}MB.
        </p>
        <button onClick={() => setUploaded(true)} className="mt-2 rounded-md bg-brand px-3 py-1.5 text-[11.5px] font-semibold text-white hover:opacity-90">Tải logo lên</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* the two real frames, side by side, at true pixel size */}
      <div className="flex flex-wrap items-start gap-4 rounded-lg border border-line bg-canvas/30 p-3">
        {(['detail', 'card'] as const).map((k) => (
          <div key={k}>
            <LogoInFrame frame={k} text={short} ratio={ratio} zoom={zoom} showBox />
            <p className="mt-1 text-[10px] leading-tight text-faint">
              {LOGO_FRAMES[k].label}<br />
              <span className="font-mono">{LOGO_FRAMES[k].w}×{LOGO_FRAMES[k].h}</span> · lề {LOGO_FRAMES[k].pad}px
            </p>
          </div>
        ))}
        {/* Compact size control — a labelled slider and nothing else. */}
        <div className="w-[150px] shrink-0">
          <div className="flex items-baseline justify-between">
            <label className="text-[10.5px] font-medium text-ink/80">Cỡ hiển thị</label>
            <span className="font-mono text-[10.5px] tabular-nums text-brand">{zoom}%</span>
          </div>
          <input
            type="range" min={ZOOM_MIN} max={ZOOM_MAX} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-0.5 w-full accent-[var(--brand,#2D65F2)]"
          />
          <button onClick={() => setZoom(100)} className="text-[10px] text-faint hover:text-brand">Đặt lại 100%</button>

          {/* File actions belong beside the logo they act on, not under the peer row. */}
          <div className="mt-2 flex flex-col items-start gap-1">
            <button className="rounded-md border border-line bg-surface px-2 py-1 text-[10.5px] font-medium text-brand hover:border-brand">Thay logo khác</button>
            <button onClick={() => setUploaded(false)} className="rounded-md border border-line bg-surface px-2 py-1 text-[10.5px] font-medium text-muted hover:border-rose-300 hover:text-rose-600">Gỡ logo</button>
            <span className="text-[9.5px] leading-tight text-faint">logo.png · 1024×320 · 84KB</span>
          </div>
        </div>
      </div>

      {/* the row that actually settles the decision */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-ink/80">
          Xem cùng các công ty khác <span className="font-normal text-faint">— đây là cách ứng viên thực sự nhìn thấy logo</span>
        </p>
        <div className="flex flex-wrap items-start gap-2 rounded-lg border border-line bg-canvas/30 p-2.5">
          {PEERS.slice(0, 3).map((p) => (
            <div key={p.name}>
              <LogoInFrame frame="card" text={p.name} ratio={p.ratio} weight={p.weight} spacing={p.spacing} tone="muted" />
              <p className="mt-0.5 text-center text-[9.5px] text-faint">{p.name}</p>
            </div>
          ))}
          <div className="rounded-md ring-2 ring-brand ring-offset-1">
            <LogoInFrame frame="card" text={short} ratio={ratio} zoom={zoom} />
            <p className="mt-0.5 text-center text-[9.5px] font-semibold text-brand">công ty này</p>
          </div>
          {PEERS.slice(3).map((p) => (
            <div key={p.name}>
              <LogoInFrame frame="card" text={p.name} ratio={p.ratio} weight={p.weight} spacing={p.spacing} tone="muted" />
              <p className="mt-0.5 text-center text-[9.5px] text-faint">{p.name}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
