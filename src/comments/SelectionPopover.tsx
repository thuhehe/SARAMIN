import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'
import { useComments } from './CommentsProvider'
import { NO_COMMENT_ATTR, captureSelection } from './anchor'
import {
  COMMENT_CHORD_LABEL,
  QUICK_KEY_LABEL,
  hasCommentableSelection,
  isCommentChord,
  isQuickCommentKey,
  isTypingTarget,
} from './hotkeys'
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
 * that spot. `C` (or ⌘⌥M) skips the click and opens the composer
 * straight from the selection — see `hotkeys.ts`.
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

  /*
   * Mirrors `composing` for the listeners, which need it a beat earlier
   * than a re-render can give it: opening on `keydown` is followed by
   * the `keyup` of that same keystroke, and `onSelect` reading a stale
   * `false` there would re-measure a selection that has since moved into
   * the textarea — find nothing, and close the composer the key just
   * opened. The pointer path is safe for a different reason (the button
   * lives inside `data-no-comment`), but one guard for both is fewer
   * things to get wrong.
   */
  const composingRef = useRef(false)
  const setComposingNow = useCallback((value: boolean) => {
    composingRef.current = value
    setComposing(value)
  }, [])

  const dismiss = useCallback(() => {
    setDraft(null)
    setComposingNow(false)
    setBody('')
  }, [setComposingNow])

  /**
   * Read the live selection and work out where its button belongs — at
   * the end of the last rendered line, so the button trails the text the
   * way a caret would rather than sitting over the middle of it.
   *
   * Shared by the pointer path and the keyboard path so the composer
   * lands in the same place however it was opened.
   */
  const measure = useCallback((): Draft | null => {
    const root = rootRef.current
    if (!root) return null
    const captured = captureSelection(root)
    if (!captured) return null
    const rects = captured.range.getClientRects()
    const last = rects[rects.length - 1]
    if (!last) return null
    const origin = root.getBoundingClientRect()
    return {
      anchor: captured.anchor,
      top: last.bottom - origin.top + 6,
      left: Math.max(0, last.right - origin.left - 20),
    }
  }, [rootRef])

  useEffect(() => {
    if (status !== 'ready') return

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
      if (composingRef.current) return

      setDraft(measure())
    }

    document.addEventListener('mouseup', onSelect)
    document.addEventListener('keyup', onSelect)
    return () => {
      document.removeEventListener('mouseup', onSelect)
      document.removeEventListener('keyup', onSelect)
    }
  }, [status, measure])

  useEffect(() => {
    if (composing) textareaRef.current?.focus()
  }, [composing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape first, and before the typing guard — it has to work from
      // inside the composer's own textarea, which is where you are when
      // you change your mind.
      if (e.key === 'Escape') {
        dismiss()
        return
      }
      if (status !== 'ready' || composingRef.current || e.repeat) return
      if (isTypingTarget(e.target)) return
      // The chord with nothing selected means "open the rail" instead,
      // and CommentsLayer takes that case.
      if (!hasCommentableSelection()) return
      if (!isCommentChord(e) && !isQuickCommentKey(e)) return

      const next = measure()
      if (!next) return
      e.preventDefault()
      setDraft(next)
      setComposingNow(true)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [dismiss, status, measure, setComposingNow])

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
          onClick={() => setComposingNow(true)}
          title={`Comment — press ${QUICK_KEY_LABEL} or ${COMMENT_CHORD_LABEL}`}
          className="group flex items-center gap-1.5 rounded-lg border border-line bg-surface py-1.5 pl-2.5 pr-2 text-[12px] font-medium shadow-lg hover:border-brand hover:text-brand"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Comment
          {/* The shortcut is only worth learning if you meet it at the
              moment you'd use it — this button is that moment. */}
          <kbd className="rounded border border-line bg-canvas px-1.5 py-px font-sans text-[10px] font-semibold text-faint group-hover:border-brand/40 group-hover:text-brand">
            {QUICK_KEY_LABEL}
          </kbd>
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
