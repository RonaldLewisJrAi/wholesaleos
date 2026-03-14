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

// Global Unhandled Promise Rejection Guard
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason && event.reason.name === "AbortError") {
    console.warn("[SYSTEM] Suppressed safe Web Lock AbortError:", event.reason);
    event.preventDefault(); // Stop the crash from propagating to the ErrorBoundary
    return;
  }
  console.error("Unhandled Promise Rejection:", event.reason);
});

// Force production rebuild (Phase 43 Cache Invalidation)
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
console.info('[SYSTEM STARTUP] React DOM Bootstrapped Successfully.');
