import type { Metadata } from "next";
import Link from "next/link";
import { residential } from "@/config/residential";

// DRAFT. Needs attorney review, like the residential terms. Written to CalOPPA (Bus. & Prof. Code
// 22575) and in the style of the CCPA, which doesn't currently apply to us (see 1798.140(d)).
// Update UPDATED and the text whenever what we collect, the tools we use, or who we share with
// changes, and review it at least once a year.
const UPDATED = "November 23, 2026";

export const metadata: Metadata = {
  title: { absolute: "Privacy Notice | Valet Waste Disposal & Doorstep Disposal" },
  description: "How Valet Waste Disposal and Doorstep Disposal collect, use and protect your information, and how to ask us to see or delete it.",
  alternates: { canonical: "/privacy" },
};

const h2 = "mt-10 text-xl md:text-2xl font-bold text-[#1B4F72]";
const p = "mt-3 leading-relaxed text-slate-700";
const ul = "mt-3 list-disc pl-6 space-y-1.5 text-slate-700 leading-relaxed";

export default function PrivacyPage() {
  const { contact } = residential;
  const email = <a href={`mailto:${contact.email}`} className="font-semibold text-[#1B4F72] underline underline-offset-2">{contact.email}</a>;
  return (
    <div className="bg-white">
      <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1B4F72]">Privacy Notice</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated {UPDATED}</p>

        <p className={p}>
          This notice explains how Valet Waste Disposal (&quot;we&quot;, &quot;us&quot;), including our Doorstep Disposal
          trash-to-curb service, collects, uses and protects information on yourdoorstepdisposal.com and when you use our
          services. We&apos;re a locally owned San Diego business.
        </p>
        <p className={`${p} font-semibold`}>We do not sell your personal information, and we do not share it for targeted advertising.</p>

        <h2 className={h2}>Information we collect</h2>
        <p className={p}><strong>Information you give us</strong> when you fill out our Get started form, sign up, join the waitlist, request a quote or contact us:</p>
        <ul className={ul}>
          <li>Name, phone number and email address</li>
          <li>Service address, city, state and ZIP code</li>
          <li>Service details: your plan, number of carts, trash day, property type, where your carts are kept, and access notes (such as a steep driveway, stairs or pets)</li>
          <li>Gate or access codes, if you choose to give them</li>
          <li>How you heard about us, and any promo or referral code</li>
          <li>For property managers and businesses: your company, role and property details</li>
        </ul>
        <p className={p}><strong>Information created when we provide service:</strong></p>
        <ul className={ul}>
          <li>Service records, such as visit dates and times, the location of our staff at your property during a visit, and photos of your carts at the curb</li>
          <li>A record of when you accepted our service terms, including the terms version, your IP address and your browser type</li>
          <li>Messages, calls and emails between you and us</li>
        </ul>
        <p className={p}><strong>Information collected automatically</strong> when you visit our website:</p>
        <ul className={ul}>
          <li>Your IP address, browser and device type, the pages you visit, how you got to our site (for example a search engine or a link), and how you interact with pages (clicks, scrolling and taps)</li>
          <li>Cookies and similar technologies, described below</li>
        </ul>
        <p className={p}>
          When you use our trash day finder, the city or ZIP code you type is matched in your browser to show you the right page
          or link. We don&apos;t store it or connect it to you.
        </p>
        <p className={p}>We don&apos;t collect payment card numbers on this website.</p>

        <h2 className={h2}>How we use your information</h2>
        <ul className={ul}>
          <li>To provide our service: scheduling, getting to your carts, and taking them to the curb and back</li>
          <li>To contact you about your service, billing, schedule changes and questions you ask us</li>
          <li>To keep records of your service and of your agreement to our terms</li>
          <li>To understand how people find and use our website, and to improve it</li>
          <li>To protect our customers, staff and business, and to meet legal requirements</li>
        </ul>
        <p className={p}>If we want to use your information for a new purpose that isn&apos;t compatible with these, we&apos;ll tell you first.</p>

        <h2 className={h2}>Cookies and analytics</h2>
        <p className={p}>We use these on our website:</p>
        <ul className={ul}>
          <li><strong>Our own cookies</strong> that remember which flyer, post or referral link brought you to our site, so we know which ones work.</li>
          <li><strong>HubSpot</strong> cookies, which record the pages you visit. If you sign up or fill out a form, HubSpot links those visits to your contact record so we can see how you found us.</li>
          <li><strong>Microsoft Clarity</strong>, which records how visitors use our pages (clicks, scrolling and page views) and produces heatmaps and session replays, so we can find and fix problems. Clarity masks text you type into forms.</li>
          <li><strong>Google Analytics</strong>, which uses cookies to count visits and see which pages people view and how they found us.</li>
        </ul>
        <p className={p}>
          You can block or delete cookies in your browser settings. The site still works without them. Our website does not
          currently change its behavior in response to browser &quot;Do Not Track&quot; signals.
        </p>

        <h2 className={h2}>Who we share information with</h2>
        <p className={p}>We share information only with service providers that help us run our business, and only for that purpose:</p>
        <ul className={ul}>
          <li><strong>HubSpot</strong>: customer records, forms and website analytics</li>
          <li><strong>Supabase</strong>: our secure service database (routes, schedules and service records)</li>
          <li><strong>Resend</strong>: sending emails, including service emails and our own alerts when you fill out a form</li>
          <li><strong>Hostinger</strong>: website hosting</li>
          <li><strong>Microsoft Clarity</strong>: website analytics</li>
          <li><strong>Google Analytics</strong>: website analytics</li>
          <li>Our phone and text messaging providers, for calls and texts with you</li>
        </ul>
        <p className={p}>
          We may also disclose information if the law requires it, to protect someone&apos;s safety, or as part of a sale or
          transfer of our business, in which case this notice would continue to apply to your information.
        </p>

        <h2 className={h2}>Links to other websites</h2>
        <p className={p}>
          Our site links to other websites, such as your city&apos;s or trash hauler&apos;s collection schedule lookup. We don&apos;t
          control those sites, and their own privacy policies apply to anything you enter there.
        </p>

        <h2 className={h2}>How we protect your information</h2>
        <p className={p}>
          We use reasonable security measures for the kind of information we hold. Gate and access codes are encrypted when
          stored and are only shown to our office and the person servicing your property. No system is perfectly secure, so
          please contact us right away if you think your information has been misused.
        </p>

        <h2 className={h2}>How long we keep information</h2>
        <p className={p}>
          We keep customer information for as long as you&apos;re a customer, and afterward for as long as reasonably needed for
          billing, records, resolving disputes and legal requirements. Waitlist and quote information is kept until we can offer
          service in your area or you ask us to delete it. Website analytics data is kept according to the settings of the
          analytics provider.
        </p>

        <h2 className={h2}>Your choices and requests</h2>
        <p className={p}>You can ask us to:</p>
        <ul className={ul}>
          <li>Tell you what personal information we have about you and give you a copy</li>
          <li>Correct information that&apos;s wrong</li>
          <li>Delete your information, except what we need to keep to provide service you&apos;ve asked for or to meet legal requirements</li>
          <li>Stop sending you marketing messages (you can also use the unsubscribe link in any marketing email)</li>
        </ul>
        <p className={p}>
          Email {email} or call or text us at{" "}
          <a href={`tel:${contact.phoneHref}`} className="font-semibold text-[#1B4F72] whitespace-nowrap">{contact.phone}</a>. We may need to
          confirm your identity before we act on a request. We respond within 45 days, and we won&apos;t treat you differently
          for making a request.
        </p>

        <h2 className={h2}>Children</h2>
        <p className={p}>Our services are for adults. We don&apos;t knowingly collect information from children under 16.</p>

        <h2 className={h2}>Changes to this notice</h2>
        <p className={p}>
          If we change this notice, we&apos;ll update the date at the top of this page. If a change is significant, we&apos;ll
          also let customers know by email or text.
        </p>

        <h2 className={h2}>Contact us</h2>
        <p className={p}>
          Valet Waste Disposal (Doorstep Disposal), San Diego, California
          <br />
          {email} · <a href={`tel:${contact.phoneHref}`} className="font-semibold text-[#1B4F72]">{contact.phone}</a>
        </p>
        <p className="mt-8 text-sm text-slate-500">
          See also our <Link href="/residential/terms" className="underline underline-offset-2">Residential Service Terms</Link>.
        </p>
      </article>
    </div>
  );
}
