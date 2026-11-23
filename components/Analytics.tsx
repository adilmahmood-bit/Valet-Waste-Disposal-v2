"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Site-wide analytics. Both are listed in the privacy notice (/privacy); update it if this changes.
// - HubSpot tracking code: records page views and links them to a contact when someone submits
//   a form. The residential sign-up API already forwards the hubspotutk cookie it sets.
// - Microsoft Clarity: heatmaps and session replays. Leave CLARITY_ID empty to turn it off.
// - Google Analytics 4: page views and visits. Page changes inside the site are counted by GA4's
//   Enhanced measurement ("page changes based on browser history events", on by default).
//   Leave GA_ID empty to turn it off.
const HUBSPOT_PORTAL_ID = "246187700";
const CLARITY_ID = "ze8pdezj8r"; // clarity.microsoft.com project for yourdoorstepdisposal.com
const GA_ID = "G-4EST8B3VW9"; // GA4 property "valetwastedisposal.com", web stream for yourdoorstepdisposal.com

export default function Analytics() {
  const path = usePathname() ?? "";
  // Never track the admin tools, the customer account pages (sign-in link URLs carry a
  // one-time token, and session recordings would show customers' addresses), or local dev/preview (keeps test visits out of the reports).
  if (path.startsWith("/admin") || path.startsWith("/account") || process.env.NODE_ENV !== "production") return null;

  return (
    <>
      <Script id="hs-script-loader" src={`https://js-na2.hs-scripts.com/${HUBSPOT_PORTAL_ID}.js`} strategy="afterInteractive" />
      {CLARITY_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
      {GA_ID && (
        <>
          <Script id="ga-src" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
    </>
  );
}
