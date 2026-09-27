import Script from "next/script";
import { IconPhone, IconMail, IconMapPin } from "@tabler/icons-react";

export default function CTABand() {
  return (
    <section id="contact" className="py-20 px-4" style={{ backgroundColor: "#1B4F72" }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* Left */}
        <div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-white mb-4"
            style={{ fontFamily: "var(--font-libre-franklin)", letterSpacing: "-0.01em" }}
          >
            Twenty minutes is all we need.
          </h2>
          <p className="text-white mb-8">
            One call. We walk the property, build the route, and have service running in 30 days.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { icon: <IconPhone size={20} color="white" stroke={1.5} />, text: "619-324-8875" },
              { icon: <IconMail size={20} color="white" stroke={1.5} />, text: "contact@valetwastedisposal.com" },
              { icon: <IconMapPin size={20} color="white" stroke={1.5} />, text: "San Diego County" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  {item.icon}
                </div>
                <span className="text-white text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — HubSpot quote form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 overflow-hidden">
          <h3
            className="text-xl font-bold text-ink mb-1"
            style={{ fontFamily: "var(--font-libre-franklin)" }}
          >
            Request a Free Quote
          </h3>
          <p className="text-ink-mid text-sm">We will follow-up today.</p>

          {/* The form renders in an iframe with its own padding; negative
              margins pull it flush with the card so the spacing stays tight. */}
          <div
            className="hs-form-frame min-h-[420px] -mx-8 -mt-9 -mb-10"
            data-region="na2"
            data-form-id="bfe62776-5fcc-449f-aac4-e267292a157f"
            data-portal-id="246187700"
          />
          <Script src="https://js-na2.hsforms.net/forms/embed/246187700.js" strategy="afterInteractive" />
        </div>
      </div>
    </section>
  );
}
