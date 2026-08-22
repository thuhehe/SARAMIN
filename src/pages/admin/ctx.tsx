/*
 * Cross-cutting context for the admin console: the breadcrumb a detail view
 * publishes up to the shell, screen-to-screen navigation, and read-only scope.
 */
import { createContext, useContext, useEffect, useRef } from 'react'

/* ── Detail breadcrumb ───────────────────────────────────────────────────────
   A detail view publishes its own crumb (and the way back) up to the admin shell,
   so the breadcrumb reads "CRM / Companies / Đại Dương" and IS the way back. That
   replaces the per-page "← Back to X" button: one navigation affordance, in the
   place every admin console puts it, instead of two that can disagree. */
export type DetailCrumb = { label: string; onBack: () => void }
export const DetailCrumbCtx = createContext<(c: DetailCrumb | null) => void>(() => {})

/** Publish this detail view's crumb for as long as it is mounted. */
export function useDetailCrumb(label: string, onBack: () => void) {
  const set = useContext(DetailCrumbCtx)
  const cb = useRef(onBack)
  cb.current = onBack
  useEffect(() => {
    set({ label, onBack: () => cb.current() })
    return () => set(null)
  }, [label, set])
}

/* Cross-page record links. A quotation opened from the Purchase-order list must
   land on the QUOTATIONS page, not render inside Purchase order — otherwise the
   breadcrumb reads "CRM / Purchase order / QUO-…", naming the wrong module for
   the record you are looking at, and Back returns to the wrong list. So the link
   asks the shell to switch pages and pass the record to open. */
export const ScreenNavCtx = createContext<(specId: string, record?: string) => void>(() => {})
/** The record the shell wants this page to open on arrival, if any. */
export const OpenRecordCtx = createContext<string | null>(null)
/* The page title row owns the primary create action, so the shell has to be able
   to trigger a create that REPLACES the page (company, job) as well as one that
   opens a modal. A bumped counter is the signal; the page decides what to do. */
export const CreateSignalCtx = createContext(0)

/* ── Read-only record ─────────────────────────────────────────────────────────
   A rep can REACH a colleague's company through search (that is what stops
   duplicates being created) but may not ACT on it. Carried as context rather than
   a prop threaded through eight components: the detail page is deep, and a new
   button added to a nested card would otherwise quietly stay writable.

   Read stays fully open — every tab, every figure. Only WRITE is withdrawn, and
   the way back is an explicit reassignment, not a silent edit. */
export const ReadOnlyCtx = createContext(false)
export const useReadOnly = () => useContext(ReadOnlyCtx)
/** Uniform reason text, so every disabled control explains itself the same way. */
export const RO_HINT = 'Chỉ đọc — công ty này do sales khác phụ trách. Yêu cầu chuyển giao để chỉnh sửa.'
