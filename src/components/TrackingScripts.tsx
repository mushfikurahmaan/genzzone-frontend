/**
 * MetaPixelScripts — Server Component.
 *
 * Receives pixel IDs fetched server-side and:
 *   1. Injects the official Meta Pixel base code via next/script (afterInteractive).
 *      The inline script includes the full IIFE stub + fbevents.js loader, one
 *      fbq('init', id) call per pixel ID, and the initial PageView.
 *   2. Server-renders a <noscript> fallback <img> tag for every pixel ID so
 *      non-JS browsers are still tracked. These are in the initial HTML response.
 *
 * SPA navigation PageView events are handled by PixelPageViewTracker (client component).
 */

import Script from 'next/script';

interface MetaPixelScriptsProps {
  pixelIds: string[];
}

export function MetaPixelScripts({ pixelIds }: MetaPixelScriptsProps) {
  if (pixelIds.length === 0) return null;

  // Build the official Meta Pixel base code with dynamic pixel ID(s).
  // Matches the snippet from Meta's Events Manager verbatim.
  const inlineScript = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
${pixelIds.map((id) => `fbq('init','${id}');`).join('\n')}
fbq('track','PageView');
`.trim();

  return (
    <>
      {/* Inline base code — next/script injects this after hydration, far earlier
          than a useEffect because Next.js manages the scheduling queue. */}
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {inlineScript}
      </Script>

      {/* <noscript> fallback — server-rendered into the initial HTML so it is
          present even before any JS runs, matching the official guideline. */}
      {pixelIds.map((id) => (
        <noscript key={id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ))}
    </>
  );
}
