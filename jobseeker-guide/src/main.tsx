import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Guide } from './Guide'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Guide />
  </StrictMode>,
)
