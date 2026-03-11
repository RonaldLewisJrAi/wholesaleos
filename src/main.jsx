import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/vision-theme.css'
import './styles/glass.css'
import App from './App.jsx'

// Force production rebuild (Phase 43 Cache Invalidation)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
