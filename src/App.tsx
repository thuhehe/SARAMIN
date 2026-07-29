import { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useParams,
  Link,
  useLocation,
} from 'react-router-dom'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { MetaRail } from './components/MetaRail'
import { SpecView } from './components/SpecView'
import { Overview } from './pages/Overview'
import { Legend } from './pages/Legend'
import { Modules } from './pages/Modules'
import { BuildPlan } from './pages/BuildPlan'
import { Mockups } from './pages/Mockups'
import { CompanyMockups } from './pages/CompanyMockups'
import { AdminWireframe } from './pages/AdminWireframe'
import { ModuleDetail, FeatureDetail } from './pages/ModuleDetail'
import { SPECS, NAV_ORDER, NAV } from './data'
import { StatusDot } from './components/StatusBadge'
import { CommentsProvider, useComments } from './comments/CommentsProvider'
import { CommentableRoot } from './comments/CommentableRoot'
import { CommentsLayer } from './comments/CommentsLayer'
import { OAuthCallback } from './comments/OAuthCallback'
import { CALLBACK_PATH } from './comments/oauth'

function useScrollTopOnRoute() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('scroll-main')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname])
}

function FeaturePage() {
  const { id } = useParams<{ id: string }>()
  const spec = id ? SPECS[id] : undefined

  if (!spec) return <Navigate to="/" replace />

  const idx = NAV_ORDER.indexOf(spec.id)
  const prev = idx > 0 ? SPECS[NAV_ORDER[idx - 1]] : undefined
  const next = idx >= 0 && idx < NAV_ORDER.length - 1 ? SPECS[NAV_ORDER[idx + 1]] : undefined

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <SpecView spec={spec} />
        <div className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-5">
          {prev ? (
            <Link
              to={`/f/${prev.id}`}
              className="group flex flex-col items-start rounded-xl border border-line bg-surface px-4 py-2.5 hover:border-brand transition-colors max-w-[46%]"
            >
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <ChevronLeft className="h-3 w-3" /> Previous
              </span>
              <span className="text-[13px] font-medium truncate group-hover:text-brand">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={`/f/${next.id}`}
              className="group flex flex-col items-end rounded-xl border border-line bg-surface px-4 py-2.5 hover:border-brand transition-colors max-w-[46%] ml-auto"
            >
              <span className="flex items-center gap-1 text-[11px] text-muted">
                Next <ChevronRight className="h-3 w-3" />
              </span>
              <span className="text-[13px] font-medium truncate group-hover:text-brand">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
      <MetaRail spec={spec} />
    </div>
  )
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-0 top-0 h-full w-[86%] max-w-[320px] bg-surface shadow-xl overflow-y-auto scroll-thin">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-soft sticky top-0 bg-surface">
          <span className="text-[14px] font-semibold">Saramin VN · Feature Spec</span>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="py-2">
          {NAV.map((m) => (
            <div key={m.code} className="mb-1">
              <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-faint">
                {m.code} · {m.label}
              </p>
              <ul>
                {m.children.map((c) => {
                  const spec = c.id ? SPECS[c.id] : undefined
                  return (
                    <li key={c.id}>
                      <Link
                        to={`/f/${c.id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-1.5 text-[13px] text-ink/80 hover:bg-canvas/70"
                      >
                        {spec && <StatusDot status={spec.status} />}
                        {c.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Layout() {
  useScrollTopOnRoute()
  const [navOpen, setNavOpen] = useState(false)
  const { railVisible } = useComments()

  return (
    /*
     * The comment rail is fixed to the right edge, so the page has to give
     * back that width or the rail simply covers whatever is under it — on a
     * wide admin table that means losing the last four columns and the
     * primary action. Only from `lg` up: below that the rail is most of the
     * viewport and there is no room to reflow into, so it stays an overlay.
     */
    <div
      className={[
        'min-h-screen p-3 transition-[padding] duration-150',
        railVisible ? 'lg:pr-[calc(var(--comment-rail-w)+0.75rem)]' : '',
      ].join(' ')}
    >
      {/* mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 mb-3 rounded-xl border border-line bg-surface px-4 py-2.5">
        <button onClick={() => setNavOpen(true)} className="text-ink">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="text-[14px] font-semibold">
          Saramin VN · Feature Spec
        </Link>
      </div>
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex gap-4">
        <Sidebar />
        {/* Width caps + top padding dropped so the admin prototypes can use
            the full viewport. */}
        <main id="scroll-main" className="flex-1 min-w-0">
          {/* Everything inside is commentable; the nav and rails are not. */}
          <CommentableRoot>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/plan" element={<BuildPlan />} />
              <Route path="/mockups" element={<Mockups />} />
              <Route path="/mockups/company" element={<CompanyMockups />} />
              <Route path="/modules" element={<Modules />} />
              <Route path="/wireframe/admin" element={<AdminWireframe />} />
              <Route path="/legend" element={<Legend />} />
              <Route path="/m/:moduleId" element={<ModuleDetail />} />
              <Route path="/m/:moduleId/:featureIndex" element={<FeatureDetail />} />
              <Route path="/f/:id" element={<FeaturePage />} />
              {/* Landing strip for the BB PM sign-in round trip. It
                  redirects onward as soon as the code is exchanged. */}
              <Route path={CALLBACK_PATH} element={<OAuthCallback />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CommentableRoot>
        </main>
      </div>

      <CommentsLayer />
    </div>
  )
}

export default function App() {
  return (
    <CommentsProvider>
      <Layout />
    </CommentsProvider>
  )
}
