'use client';

import { useEffect } from 'react';
import { primeVoices } from '@/lib/speech';

export default function ServiceWorker() {
  useEffect(() => {
    primeVoices();
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is a bonus; a failed registration shouldn't surface.
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
