import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useComments } from './CommentsProvider'

/**
 * Where BB PM drops the browser after consent. Nothing of the spec site
 * renders here — it exchanges the code, then replaces this entry in the
 * history with the page the reader was on, so Back doesn't walk into a
 * spent authorization code.
 */
export function OAuthCallback() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { completeMemberSignIn } = useComments()
  const [failure, setFailure] = useState<string | null>(null)
  // StrictMode double-mounts in dev, and an authorization code is
  // single-use — the second exchange would fail on a valid sign-in.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void completeMemberSignIn(search)
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch((err: unknown) =>
        setFailure(err instanceof Error ? err.message : 'Sign-in failed'),
      )
  }, [completeMemberSignIn, navigate, search])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-[380px] rounded-2xl border border-line bg-surface p-6 text-center">
        {failure ? (
          <>
            <ShieldAlert className="mx-auto mb-3 h-6 w-6 text-red-600" />
            <h1 className="mb-1 text-[15px] font-semibold">
              Could not sign in
            </h1>
            <p className="mb-4 text-[12px] leading-relaxed text-muted">
              {failure}
            </p>
            <Link
              to="/"
              className="inline-block rounded-lg border border-line px-3 py-1.5 text-[12.5px] hover:border-brand hover:text-brand"
            >
              Back to the spec
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-brand" />
            <p className="text-[13px] text-muted">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  )
}
