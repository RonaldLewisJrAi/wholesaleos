import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/vision-theme.css'
import './styles/glass.css'
import App from './App.jsx'
import ErrorBoundary from './core/ErrorBoundary'

// Startup Diagnostics
console.info('[SYSTEM STARTUP] React DOM Initialization Commencing...');
console.info('[SYSTEM STARTUP] Error Boundary Activating...');

// Force production rebuild (Phase 43 Cache Invalidation)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
console.info('[SYSTEM STARTUP] React DOM Bootstrapped Successfully.');
