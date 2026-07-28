import { useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { useComments } from './CommentsProvider'
import { NO_COMMENT_ATTR } from './anchor'

/**
 * Passcode gate. The share link's token lives in the build
 * (`VITE_BBPM_SHARE_TOKEN`) and is useless on its own — the passcode is
 * what turns it into a session, and it is never in the bundle.
 */
export function UnlockDialog({
  onUnlocked,
  onCancel,
}: {
  /** Unlock succeeded — the caller opens the rail. */
  onUnlocked: () => void
  /** Dismissed without unlocking. */
  onCancel: () => void
}) {
  const { unlock, status, error } = useComments()
  const [passcode, setPasscode] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await unlock(passcode)
      onUnlocked()
    } catch {
      setPasscode('')
    }
  }

  return (
    <div
      {...{ [NO_COMMENT_ATTR]: true }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <form
        onSubmit={submit}
        className="relative w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-faint hover:text-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-1 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-brand" />
          <h2 className="text-[15px] font-semibold">Unlock comments</h2>
        </div>
        <p className="mb-4 text-[12px] leading-relaxed text-muted">
          Enter the passcode shared with your team. Comments are stored in
          BB&nbsp;PM and visible to everyone with this link.
        </p>

        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoFocus
          placeholder="Passcode"
          className="w-full rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[13px] outline-none focus:border-brand"
        />

        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!passcode || status === 'unlocking'}
          className="mt-3 w-full rounded-lg bg-brand py-2 text-[13px] font-medium text-white disabled:opacity-40"
        >
          {status === 'unlocking' ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </div>
  )
}
