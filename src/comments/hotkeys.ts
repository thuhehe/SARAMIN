import { COMMENT_ROOT_ID, NO_COMMENT_ATTR } from './anchor'

/**
 * Keyboard shortcuts for commenting.
 *
 * Two ways in, because they suit different hands. The chord (⌘⌥M /
 * Ctrl+Alt+M) works whether or not anything is selected — with a
 * selection it opens the composer on it, without one it toggles the
 * rail. A bare `C` is the fast path for the common case: a reviewer who
 * has just finished dragging over a sentence still has one hand on the
 * mouse, and reaching back for a three-key chord to do the obvious next
 * thing is the friction worth removing.
 *
 * `C` only listens while text is selected, so it can never fire while
 * someone is merely reading. Both are ignored inside inputs, textareas
 * and contenteditable — including the composer itself, where `c` is a
 * letter and nothing else.
 *
 * The chord is ⌘⌥M (what Google Docs uses) rather than Notion's ⌘⇧M
 * because Chrome on macOS binds ⌘⇧M to the profile menu and a page
 * cannot take that back.
 */

const isApple =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

/** For tooltips and hint badges — the chord as this platform writes it. */
export const COMMENT_CHORD_LABEL = isApple ? '⌘⌥M' : 'Ctrl+Alt+M'

/** The one-key path, live only while text is selected. */
export const QUICK_KEY_LABEL = 'C'

/** True when the keystroke belongs to a field the reader is typing in. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.tagName !== 'string') return false
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
}

/**
 * A selection `captureSelection` would accept: real text, inside the
 * page content, outside the comment UI's own chrome.
 *
 * Deliberately a cheap predicate rather than a call to
 * `captureSelection` — this runs on a keystroke to decide *who* handles
 * it, and building the root's whole text map to answer yes/no would walk
 * every text node on a long spec page for nothing.
 */
export function hasCommentableSelection(): boolean {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0)
    return false
  if (!selection.toString().trim()) return false

  const root = document.getElementById(COMMENT_ROOT_ID)
  const node = selection.getRangeAt(0).commonAncestorContainer
  if (!root || !root.contains(node)) return false

  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement
  return !el?.closest(`[${NO_COMMENT_ATTR}]`)
}

/** ⌘⌥M / Ctrl+Alt+M. */
export function isCommentChord(e: KeyboardEvent): boolean {
  if (!e.altKey || !(e.metaKey || e.ctrlKey) || e.shiftKey) return false
  // `e.key` is "µ" while Option is held on macOS, so match the physical
  // key instead. `key` is still the fallback for layouts that report no
  // `code` (some virtual keyboards).
  return e.code === 'KeyM' || e.key.toLowerCase() === 'm'
}

/** Bare `C`, no modifiers. */
export function isQuickCommentKey(e: KeyboardEvent): boolean {
  return (
    e.key.toLowerCase() === 'c' &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.shiftKey
  )
}
