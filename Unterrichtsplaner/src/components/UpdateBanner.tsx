import { useState, useEffect, useCallback } from 'react';
import { APP_VERSION } from '../version';

// v3.102: PWA Update-Banner — zeigt Hinweis wenn neue Version verfügbar
export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSWUpdate = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      setShowBanner(true);
    };

    // Check for updates on load
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return;

      // Already waiting SW = update available
      if (reg.waiting) {
        handleSWUpdate(reg);
        return;
      }

      // Listen for new SW installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            handleSWUpdate(reg);
          }
        });
      });
    });

    // Listen for controllerchange (SW activated) → reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Periodic update check (every 60 min)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then(reg => reg?.update());
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-blue-900/95 backdrop-blur border border-blue-500 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-xl shadow-black/40 no-print">
      <span className="text-[13px] text-blue-100">
        Neue Version verfügbar!
      </span>
      <button
        onClick={handleUpdate}
        className="px-3 py-1 rounded bg-blue-500 text-white text-[12px] font-semibold cursor-pointer hover:bg-blue-400 transition-colors"
      >
        Jetzt aktualisieren
      </button>
      <button
        onClick={() => setShowBanner(false)}
        className="text-blue-300 hover:text-white text-[11px] cursor-pointer px-1"
        title="Später"
      >
        ✕
      </button>
      <span className="text-[10px] text-blue-400/60">{APP_VERSION}</span>
    </div>
  );
}
