import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

/**
 * Agentation is a local tool: visual feedback for an AI coding agent, kept
 * in `localStorage` and copied out as a prompt. It was briefly rendered in
 * production too (fba809f) so reviewers had *some* way to comment on the
 * deployed site — which was the right call at the time, because the BB PM
 * comment rail didn't exist yet.
 *
 * It does now, so the two overlap: two floating buttons in the same corner,
 * and the one that looks like a comment box actually leads nowhere — nothing
 * typed into it reaches BB PM or anyone else, and it dies with the browser's
 * storage. Reviewer feedback belongs in the rail; this goes back to being a
 * dev tool.
 *
 * Imported lazily rather than with a plain `import` + `DEV &&` guard: the
 * static import pulls the package into the production bundle even when the
 * element is never rendered. `lazy` keeps it in a chunk that a production
 * build never asks for.
 */
const Agentation = import.meta.env.DEV
  ? lazy(() =>
      import('agentation').then((m) => ({ default: m.Agentation })),
    )
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      {Agentation && (
        <Suspense fallback={null}>
          <Agentation />
        </Suspense>
      )}
    </BrowserRouter>
  </StrictMode>,
)
