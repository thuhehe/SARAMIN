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
      {/* Visual-feedback / comment overlay — rendered in all builds so reviewers can comment on the deployed site. */}
      <Agentation />
    </BrowserRouter>
  </StrictMode>,
)
