import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/vision-theme.css'
import './styles/glass.css'
import App from './App.jsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.jsx'

// Force production rebuild (Phase 43 Cache Invalidation)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
