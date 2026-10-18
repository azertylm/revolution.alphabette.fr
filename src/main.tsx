import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* ==========================================================================
   Révolution est installable (prompt 10) : un service worker minimal met en
   cache la coquille pour que l'application reste utilisable sans réseau.
   Enregistré uniquement en production : en développement, on ne veut jamais
   servir du vieux code.
   ========================================================================== */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      /* pas de service worker : l'application fonctionne quand même. */
    });
  });
}
