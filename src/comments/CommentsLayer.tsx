import { useEffect, useState } from 'react'
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
  const { status, threads, activeId } = useComments()
  const [railOpen, setRailOpen] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  // Clicking a highlight in the page opens the rail on that thread.
  useEffect(() => {
    if (activeId) setRailOpen(true)
  }, [activeId])

  if (status === 'unavailable') return null

  const openCount = threads.filter((t) => t.resolvedAt === null).length

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

      {railOpen && status === 'ready' && (
        <CommentRail onClose={() => setRailOpen(false)} />
      )}

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
