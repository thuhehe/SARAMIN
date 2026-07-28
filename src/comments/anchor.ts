import type { CommentAnchor } from './types'

/**
 * Text anchoring, the same shape the W3C annotation model uses: a
 * *quote* plus a little *prefix/suffix* context, plus a plain-text
 * *offset* as a tiebreaker. Nothing here touches the React tree — we
 * only read the DOM and hand back `Range` objects, so re-renders can
 * never fight us for ownership of a node.
 *
 * Why not store an element id and a child index? Because the spec
 * content is regenerated from `src/data/**` on every edit; ids and
 * indices churn constantly while sentences mostly don't. Matching on
 * the text itself is what makes a comment survive "we added a bullet
 * above yours".
 */

/** Marks the element whose text is commentable. Set by CommentsLayer. */
export const COMMENT_ROOT_ID = 'commentable-root'

/** Opt an element (and its subtree) out of anchoring and selection. */
export const NO_COMMENT_ATTR = 'data-no-comment'

const CONTEXT_WINDOW = 64

interface Segment {
  node: Text
  /** Index of this node's first character within `TextMap.text`. */
  start: number
  end: number
}

interface TextMap {
  text: string
  segments: Segment[]
}

/**
 * Flatten the root's rendered text into one string, remembering which
 * text node each character came from. Skips anything inside a
 * `data-no-comment` subtree so the comment UI can't anchor to itself.
 */
function buildTextMap(root: HTMLElement): TextMap {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (parent.closest(`[${NO_COMMENT_ATTR}]`)) return NodeFilter.FILTER_REJECT
      const tag = parent.tagName
      if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const segments: Segment[] = []
  let text = ''
  let node = walker.nextNode() as Text | null
  while (node) {
    const value = node.data
    if (value.length) {
      segments.push({ node, start: text.length, end: text.length + value.length })
      text += value
    }
    node = walker.nextNode() as Text | null
  }
  return { text, segments }
}

/** Global character index of a (node, offset) DOM position. */
function offsetOf(map: TextMap, node: Node, offset: number): number | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const seg = map.segments.find((s) => s.node === node)
    return seg ? seg.start + Math.min(offset, seg.node.data.length) : null
  }
  // Element position: resolve to the start of the first text node at or
  // after `offset` among its children.
  const children = Array.from(node.childNodes)
  for (let i = offset; i < children.length; i += 1) {
    const seg = map.segments.find((s) => children[i].contains(s.node))
    if (seg) return seg.start
  }
  // Nothing after it — fall back to the end of the last text node before.
  for (let i = Math.min(offset, children.length) - 1; i >= 0; i -= 1) {
    const inside = map.segments.filter((s) => children[i].contains(s.node))
    if (inside.length) return inside[inside.length - 1].end
  }
  return null
}

/** Turn a character span back into a DOM Range. */
function rangeFrom(map: TextMap, start: number, end: number): Range | null {
  const startSeg = map.segments.find((s) => start >= s.start && start < s.end)
  const endSeg = map.segments.find((s) => end > s.start && end <= s.end)
  if (!startSeg || !endSeg) return null
  const range = document.createRange()
  range.setStart(startSeg.node, start - startSeg.start)
  range.setEnd(endSeg.node, end - endSeg.start)
  return range
}

export interface CapturedSelection {
  anchor: CommentAnchor
  /** Live range, used to place the floating button. Not persisted. */
  range: Range
}

/**
 * Read the user's current selection as an anchor. Returns null for a
 * collapsed selection, a selection outside the root, or one that is all
 * whitespace — none of those are things a person meant to comment on.
 */
export function captureSelection(root: HTMLElement): CapturedSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0)
    return null

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return null

  const quote = range.toString()
  if (!quote.trim()) return null

  const map = buildTextMap(root)
  const start = offsetOf(map, range.startContainer, range.startOffset)
  const end = offsetOf(map, range.endContainer, range.endOffset)
  if (start === null || end === null || end <= start) return null

  return {
    anchor: {
      containerId: root.id || COMMENT_ROOT_ID,
      quote,
      prefix: map.text.slice(Math.max(0, start - CONTEXT_WINDOW), start),
      suffix: map.text.slice(end, end + CONTEXT_WINDOW),
      textOffset: start,
    },
    range: range.cloneRange(),
  }
}

/** How many characters two strings share, counting from their touching ends. */
function overlapFromEnd(a: string, b: string): number {
  let n = 0
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n])
    n += 1
  return n
}

function overlapFromStart(a: string, b: string): number {
  let n = 0
  while (n < a.length && n < b.length && a[n] === b[n]) n += 1
  return n
}

/**
 * Find where an anchor points *now*. Returns null when the quote is
 * gone from the page — the caller renders that thread as orphaned.
 *
 * When the same sentence appears more than once (common in a spec:
 * "Required." shows up under a dozen fields), the stored prefix/suffix
 * pick the right occurrence, and the old offset breaks any remaining
 * tie by proximity.
 */
export function resolveAnchor(
  root: HTMLElement,
  anchor: CommentAnchor,
): Range | null {
  if (!anchor.quote) return null
  const map = buildTextMap(root)

  const candidates: number[] = []
  let from = map.text.indexOf(anchor.quote)
  while (from !== -1) {
    candidates.push(from)
    from = map.text.indexOf(anchor.quote, from + 1)
  }
  if (candidates.length === 0) return null

  let best = candidates[0]
  if (candidates.length > 1) {
    let bestScore = -Infinity
    for (const index of candidates) {
      const before = map.text.slice(Math.max(0, index - CONTEXT_WINDOW), index)
      const after = map.text.slice(
        index + anchor.quote.length,
        index + anchor.quote.length + CONTEXT_WINDOW,
      )
      // Context agreement dominates; distance from the original offset
      // only separates candidates the context couldn't.
      const context =
        overlapFromEnd(before, anchor.prefix ?? '') +
        overlapFromStart(after, anchor.suffix ?? '')
      const drift =
        anchor.textOffset === null ? 0 : Math.abs(index - anchor.textOffset)
      const score = context * 1000 - drift
      if (score > bestScore) {
        bestScore = score
        best = index
      }
    }
  }

  return rangeFrom(map, best, best + anchor.quote.length)
}

export interface HighlightBox {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Client rects for a range, expressed relative to `container`. One box
 * per rendered line, so a quote wrapping three lines highlights as
 * three boxes instead of one fat rectangle over the paragraph.
 */
export function boxesFor(range: Range, container: HTMLElement): HighlightBox[] {
  const origin = container.getBoundingClientRect()
  return Array.from(range.getClientRects())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({
      top: r.top - origin.top,
      left: r.left - origin.left,
      width: r.width,
      height: r.height,
    }))
}
