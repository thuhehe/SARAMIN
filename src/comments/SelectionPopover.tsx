import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'
import { useComments } from './CommentsProvider'
import { NO_COMMENT_ATTR, captureSelection } from './anchor'
import type { CommentAnchor } from './types'
import { NameField } from './NameField'

interface Draft {
  anchor: CommentAnchor
  /** Position of the button/composer, relative to the commentable root. */
  top: number
  left: number
}

/**
 * The Notion gesture: select text, a small "Comment" button appears at
 * the end of the selection, clicking it opens a composer anchored to
 * that spot.
 *
 * Selection is read on `mouseup` / `keyup` rather than `selectionchange`
 * — the latter fires on every pixel of a drag, and re-measuring the
 * anchor mid-drag makes the button jitter and steals the selection on
 * some browsers.
 */
export function SelectionPopover({
  rootRef,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>
}) {
  const { status, post, name } = useComments()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [composing, setComposing] = useState(false)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const dismiss = useCallback(() => {
    setDraft(null)
    setComposing(false)
    setBody('')
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    const root = rootRef.current
    if (!root) return

    const onSelect = (event: Event) => {
      // Ignore anything happening inside the comment UI itself.
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(`[${NO_COMMENT_ATTR}]`)
      )
        return
      // While the composer is open the selection is frozen — the user is
      // typing about it, not picking a new one.
      if (composing) return

      const captured = captureSelection(root)
      if (!captured) {
        setDraft(null)
        return
      }
      const rects = captured.range.getClientRects()
      const last = rects[rects.length - 1]
      if (!last) {
        setDraft(null)
        return
      }
      const origin = root.getBoundingClientRect()
      setDraft({
        anchor: captured.anchor,
        top: last.bottom - origin.top + 6,
        left: Math.max(0, last.right - origin.left - 20),
      })
    }

    document.addEventListener('mouseup', onSelect)
    document.addEventListener('keyup', onSelect)
    return () => {
      document.removeEventListener('mouseup', onSelect)
      document.removeEventListener('keyup', onSelect)
    }
  }, [status, rootRef, composing])

  useEffect(() => {
    if (composing) textareaRef.current?.focus()
  }, [composing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dismiss])

  if (status !== 'ready' || !draft) return null

  const submit = async () => {
    if (!body.trim() || busy) return
    setBusy(true)
    try {
      await post({ body, anchor: draft.anchor })
      dismiss()
      window.getSelection()?.removeAllRanges()
    } catch {
      // The provider already surfaced the failure; keep the text so the
      // reviewer doesn't lose what they typed.
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      {...{ [NO_COMMENT_ATTR]: true }}
      className="absolute z-30"
      style={{ top: draft.top, left: draft.left }}
    >
      {!composing ? (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()} // keep the selection alive
          onClick={() => setComposing(true)}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium shadow-lg hover:border-brand hover:text-brand"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Comment
        </button>
      ) : (
        <div className="w-[320px] rounded-xl border border-line bg-surface p-3 shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="line-clamp-2 border-l-2 border-amber-400 pl-2 text-[11px] italic text-muted">
              {draft.anchor.quote}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 text-faint hover:text-ink"
              aria-label="Cancel comment"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {!name && <NameField className="mb-2" />}

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit()
            }}
            rows={3}
            maxLength={4000}
            placeholder="Ask a question or leave a note…"
            className="w-full resize-y rounded-lg border border-line bg-canvas/50 px-2.5 py-2 text-[13px] outline-none focus:border-brand"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-faint">⌘↵ to send</span>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!body.trim() || busy}
              className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
            >
              {busy ? 'Sending…' : 'Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
