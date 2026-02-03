'use client';

import { useEffect } from 'react';
import { trackingApi } from '@/lib/api';

/**
 * Fetches active tracking codes from the backend and injects them into the page
 * (e.g. Meta Pixel, Google Analytics). Runs only on the client.
 */
export function TrackingScripts() {
  useEffect(() => {
    let mounted = true;

    async function injectTrackingCodes() {
      try {
        const codes = await trackingApi.getActive();
        if (!mounted || !codes.length) return;

        for (const code of codes) {
          const target = code.placement === 'head' ? document.head : document.body;

          // Strip any wrapping <script>...</script> so we never run HTML as JS (avoids "Unexpected token '<'" errors)
          let scriptContent = (code.script_content || '').trim();
          const scriptTagOpen = /^\s*<script[^>]*>\s*/i;
          const scriptTagClose = /\s*<\/script>\s*$/i;
          if (scriptTagOpen.test(scriptContent)) scriptContent = scriptContent.replace(scriptTagOpen, '');
          if (scriptTagClose.test(scriptContent)) scriptContent = scriptContent.replace(scriptTagClose, '');

          const script = document.createElement('script');
          script.id = code.script_id;
          script.textContent = scriptContent;
          target.appendChild(script);

          if (code.noscript_content?.trim()) {
            const noscript = document.createElement('noscript');
            noscript.innerHTML = code.noscript_content;
            target.appendChild(noscript);
          }
        }
      } catch (err) {
        console.error('Failed to load tracking codes:', err);
      }
    }

    injectTrackingCodes();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
