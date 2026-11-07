import { useState } from 'react'
import { ARTWORK_SETS, TAGS, cleanTagName, findTag, tagKey, tagName } from '@/pages/admin/data/products'

/* ── Tag field ────────────────────────────────────────────────────────────────
   Tags are NOT a closed master list: HQ types a new one and it exists. That is
   deliberate — the taxonomy that must hold still is INDUSTRY, and forcing every
   loose label ("tết", "nữ giới", "ngoài trời") through a master-data release is
   how tagging quietly stops happening.

   Creating from the field itself, rather than from a separate admin screen, is
   the whole difference: the moment you need a tag is WHILE classifying a picture,
   not before. */
export function TagField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const hits = TAGS.filter((t) => !value.includes(t.id) && tagKey(t.name).includes(tagKey(q)))
  /* An existing tag is matched on the NORMALISED key, so "  Văn Phòng " finds
     "Văn phòng" instead of offering to create a second one. */
  const exact = findTag(q)
  const canCreate = cleanTagName(q) !== '' && !exact
  const add = (id: string) => { onChange([...value, id]); setQ(''); setOpen(false) }
  const create = () => {
    const name = cleanTagName(q)
    const dup = findTag(name)
    if (dup) return add(dup.id)          // typed a duplicate: reuse, never a second row
    const id = 't-' + Date.now().toString(36)
    TAGS.push({ id, name })              // wireframe only; a real build POSTs /admin/artwork-tags
    add(id)
  }
  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5">
        {value.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] text-muted">
            {tagName(id)}
            <button onClick={() => onChange(value.filter((x) => x !== id))} className="text-faint hover:text-ink">✕</button>
          </span>
        ))}
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (hits[0] && !canCreate) add(hits[0].id); else if (canCreate) create() }
            if (e.key === 'Backspace' && q === '' && value.length) onChange(value.slice(0, -1))
          }}
          placeholder={value.length ? 'thêm tag…' : 'Gõ để tìm hoặc tạo tag mới…'}
          className="min-w-[150px] flex-1 bg-transparent py-0.5 text-[11.5px] outline-none placeholder:text-faint"
        />
      </div>
      {open && (q.trim() !== '' || hits.length > 0) && (
        <div className="absolute z-30 mt-1 max-h-[180px] w-full overflow-y-auto rounded-lg border border-line bg-surface shadow-lg">
          {canCreate && (
            <button onMouseDown={(e) => { e.preventDefault(); create() }} className="flex w-full items-center gap-1.5 border-b border-line-soft px-2.5 py-1.5 text-left text-[11.5px] font-medium text-brand hover:bg-brand-soft">
              ＋ Tạo tag “{q.trim()}”
            </button>
          )}
          {hits.map((t) => (
            <button key={t.id} onMouseDown={(e) => { e.preventDefault(); add(t.id) }} className="block w-full px-2.5 py-1.5 text-left text-[11.5px] text-ink/85 hover:bg-canvas">{t.name}</button>
          ))}
          {hits.length === 0 && !canCreate && <p className="px-2.5 py-1.5 text-[11px] text-faint">Không có tag nào khớp.</p>}
        </div>
      )}
    </div>
  )
}

/* ── Tag manager ──────────────────────────────────────────────────────────────
   Rename and delete, because a tag list nobody can tidy becomes forty near-
   duplicates within a quarter. Deleting a tag detaches it from every set and
   never deletes a set: losing a label is not a reason to lose a photograph. */
export function TagManager({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0)
  const [newName, setNewName] = useState('')
  const usage = (id: string) => ARTWORK_SETS.filter((s) => !s.archived && s.tags.includes(id)).length
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6" onClick={onClose}>
      <div className="my-4 w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Quản lý tag</p>
            <p className="text-[11px] text-muted">HQ tự tạo, sửa tên và xoá — không cần phát hành master data.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="p-5">
          <div className="mb-3 flex gap-1.5">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên tag mới…" className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] outline-none focus:border-brand" />
            <button
              disabled={!newName.trim()}
              onClick={() => {
                const name = cleanTagName(newName)
                if (name && !findTag(name)) TAGS.push({ id: 't-' + Date.now().toString(36), name })
                setNewName(''); force((n) => n + 1)
              }}
              className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >＋ Tạo</button>
          </div>
          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-line">
            {TAGS.map((t) => (
              <div key={t.id} className="flex items-center gap-2 border-b border-line-soft px-2.5 py-1.5 last:border-b-0">
                <input
                  defaultValue={t.name}
                  onBlur={(e) => {
                    const name = cleanTagName(e.target.value)
                    const clash = findTag(name)
                    /* Renaming onto an existing name would create the duplicate the
                       key exists to prevent, so it is refused rather than merged —
                       merging two tags silently moves pictures nobody asked to move. */
                    if (name && (!clash || clash.id === t.id)) t.name = name
                    force((n) => n + 1)
                  }}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11.5px] text-ink outline-none hover:border-line focus:border-brand"
                />
                <span className="shrink-0 text-[10px] text-faint">{usage(t.id)} cụm</span>
                <button
                  onClick={() => {
                    const n = usage(t.id)
                    if (n === 0 || confirm(`Xoá tag “${t.name}”? ${n} cụm đang gắn sẽ bị gỡ nhãn — ảnh vẫn giữ nguyên.`)) {
                      ARTWORK_SETS.forEach((s) => { s.tags = s.tags.filter((x) => x !== t.id) })
                      TAGS.splice(TAGS.findIndex((x) => x.id === t.id), 1)
                      force((k) => k + 1)
                    }
                  }}
                  className="shrink-0 text-[11px] text-faint hover:text-rose-600"
                >Xoá</button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
            Đổi tên áp dụng ngay cho mọi cụm đang gắn. Xoá thì <b>chỉ gỡ nhãn</b> — không cụm ảnh nào bị xoá theo.
          </p>
        </div>
      </div>
    </div>
  )
}
