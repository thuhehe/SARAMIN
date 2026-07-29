import { useEffect, useRef, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useComments } from './CommentsProvider'
import { NO_COMMENT_ATTR } from './anchor'
import { CommentRail } from './CommentRail'
import { UnlockDialog } from './UnlockDialog'

/**
 * The always-mounted chrome: the floating toggle, the rail, and the
 * unlock dialog. Renders nothing at all when the build has no share
 * link configured, so the spec site is unchanged for anyone who hasn't
 * turned comments on.
 */
export function CommentsLayer() {
  // `railOpen` lives in the provider: the page reads it too, so it can
  // reserve room instead of letting the fixed rail cover the content.
  const { status, allThreads, activeId, railOpen, setRailOpen, railVisible } =
    useComments()
  const [unlocking, setUnlocking] = useState(false)

  // Clicking a highlight in the page opens the rail on that thread.
  useEffect(() => {
    if (activeId) setRailOpen(true)
  }, [activeId])

  /**
   * A member coming back from BB PM lands on the page they left, with a
   * session that arrived while this component was unmounted — nothing
   * would show for it. Opening the rail on the locked → ready edge gives
   * the round trip a visible result, and matches what the passcode path
   * does through `onUnlocked`. A returning reader whose JWT was already
   * in storage starts *at* `ready`, so there is no edge and no surprise
   * rail on load.
   */
  const previousStatus = useRef(status)
  useEffect(() => {
    if (previousStatus.current !== 'ready' && status === 'ready')
      setRailOpen(true)
    previousStatus.current = status
  }, [status])

  if (status === 'unavailable') return null

  // Site-wide, matching what the rail lists: the number on the button and
  // the number of threads you find after clicking it should agree.
  const openCount = allThreads.filter((t) => t.resolvedAt === null).length

  return (
    <>
      {!railOpen && (
        <button
          {...{ [NO_COMMENT_ATTR]: true }}
          type="button"
          onClick={() =>
            status === 'ready' ? setRailOpen(true) : setUnlocking(true)
          }
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[13px] font-medium shadow-lg hover:border-brand hover:text-brand"
        >
          <MessageSquare className="h-4 w-4" />
          {status === 'ready' ? 'Comments' : 'Unlock comments'}
          {openCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {openCount}
            </span>
          )}
        </button>
      )}

      {railVisible && <CommentRail onClose={() => setRailOpen(false)} />}

      {(unlocking || (railOpen && status !== 'ready')) && (
        <UnlockDialog
          // Unlocking is only ever a step on the way to reading the
          // threads, so land the reader in the rail rather than back on
          // the page they just asked to comment on.
          onUnlocked={() => {
            setUnlocking(false)
            setRailOpen(true)
          }}
          onCancel={() => {
            setUnlocking(false)
            setRailOpen(false)
          }}
        />
      )}
    </>
  )
}
