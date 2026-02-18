'use client';

import { useEffect } from 'react';
import { trackingApi } from '@/lib/api';

/**
 * Fetches active tracking codes from the backend and injects them into the page.
 * Each code can be the full snippet (e.g. Meta Pixel: comments, <script> and <noscript>).
 * Scripts are executed; noscript fallbacks are appended. Purchase is fired separately on order completion (lib/pixel.ts).
 */
export function TrackingScripts() {
  useEffect(() => {
    let mounted = true;

    function injectPastedCode(raw: string, index: number) {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const wrap = document.createElement('div');
      wrap.innerHTML = trimmed;

      const scripts = wrap.querySelectorAll('script');
      scripts.forEach((el, i) => {
        const script = document.createElement('script');
        script.id = `tracking-${index}-script-${i}`;
        script.textContent = el.textContent || '';
        if (el.src) script.src = el.src;
        if (el.async) script.async = true;
        document.head.appendChild(script);
      });

      const noscripts = wrap.querySelectorAll('noscript');
      noscripts.forEach((el, i) => {
        const noscript = document.createElement('noscript');
        noscript.id = `tracking-${index}-noscript-${i}`;
        noscript.innerHTML = el.innerHTML;
        document.body.appendChild(noscript);
      });

      // If the pasted content had no script/noscript tags (plain JS), inject as a single script
      if (scripts.length === 0 && noscripts.length === 0) {
        const scriptTagOpen = /^\s*<script[^>]*>\s*/i;
        const scriptTagClose = /\s*<\/script>\s*$/i;
        let scriptContent = trimmed;
        if (scriptTagOpen.test(scriptContent)) scriptContent = scriptContent.replace(scriptTagOpen, '');
        if (scriptTagClose.test(scriptContent)) scriptContent = scriptContent.replace(scriptTagClose, '');
        if (scriptContent.trim()) {
          const script = document.createElement('script');
          script.id = `tracking-${index}`;
          script.textContent = scriptContent;
          document.head.appendChild(script);
        }
      }
    }

    async function injectTrackingCodes() {
      try {
        const codes = await trackingApi.getActive();
        if (!mounted || !codes.length) return;

        codes.forEach((code, i) => injectPastedCode(code.script_content || '', i));
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
