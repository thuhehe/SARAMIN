import { useState } from 'react'
import { KeyRound, Loader2, ShieldCheck, X } from 'lucide-react'
import { useComments } from './CommentsProvider'
import { NO_COMMENT_ATTR } from './anchor'

/**
 * The gate, with two ways through it.
 *
 * **BB PM sign-in** is the primary one for the team: it leaves for BB PM,
 * comes back with a token, and the comments that follow carry a real
 * account, avatar and name. Nobody has to be told a passcode, and nobody
 * has to type who they are.
 *
 * **The passcode** stays for everyone else — the client team, an agency,
 * anyone without a BB PM account. It is the shared secret that turns the
 * token baked into this build (`VITE_BBPM_SHARE_TOKEN`, useless alone)
 * into a session, and it is never in the bundle.
 *
 * A build with no OAuth client id configured shows only the passcode, so
 * this is a superset of the old behaviour rather than a replacement.
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
  const { unlock, signInAsMember, memberSignInAvailable, status, error } =
    useComments()
  const [passcode, setPasscode] = useState('')
  // Members are the common case, so the passcode form starts collapsed —
  // unless it's the only way in.
  const [showPasscode, setShowPasscode] = useState(!memberSignInAvailable)
  const [leaving, setLeaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await unlock(passcode)
      onUnlocked()
    } catch {
      setPasscode('')
    }
  }

  const signIn = async () => {
    setLeaving(true)
    try {
      await signInAsMember()
    } catch {
      // Never got off the ground — the provider is showing why.
      setLeaving(false)
    }
  }

  return (
    <div
      {...{ [NO_COMMENT_ATTR]: true }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 shadow-2xl">
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
          Comments are stored in BB&nbsp;PM and visible to everyone with this
          link.
        </p>

        {memberSignInAvailable && (
          <>
            <button
              type="button"
              onClick={() => void signIn()}
              disabled={leaving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2 text-[13px] font-medium text-white disabled:opacity-40"
            >
              {leaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Continue with BB&nbsp;PM
                </>
              )}
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              For the Burningbros team — signs your comments with your BB&nbsp;PM
              account.
            </p>

            {!showPasscode && (
              <button
                type="button"
                onClick={() => setShowPasscode(true)}
                className="mt-3 w-full text-[11.5px] text-muted underline decoration-line hover:text-ink"
              >
                I have a passcode instead
              </button>
            )}
          </>
        )}

        {showPasscode && (
          <form onSubmit={submit} className={memberSignInAvailable ? 'mt-4' : ''}>
            {memberSignInAvailable && (
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[10px] uppercase tracking-wide text-faint">
                  or
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
              placeholder="Passcode"
              className="w-full rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[13px] outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={!passcode || status === 'unlocking'}
              className={[
                'mt-3 w-full rounded-lg py-2 text-[13px] font-medium disabled:opacity-40',
                memberSignInAvailable
                  ? 'border border-line hover:border-brand hover:text-brand'
                  : 'bg-brand text-white',
              ].join(' ')}
            >
              {status === 'unlocking' ? 'Unlocking…' : 'Unlock with passcode'}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  )
}
