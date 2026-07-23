import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Agentation } from 'agentation'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      {/* Dev-only visual-feedback overlay; compiled out of production builds. */}
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  </StrictMode>,
)
