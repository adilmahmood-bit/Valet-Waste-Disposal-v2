"use client";
import { useState } from "react";
import { IconPhone, IconMail, IconMapPin } from "@tabler/icons-react";

export default function CTABand() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    property_name: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="contact" className="py-20 px-4" style={{ backgroundColor: "#1a3a2a" }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* Left */}
        <div>
          <h2
            className="text-3xl sm:text-4xl font-bold italic text-white mb-4"
            style={{ fontFamily: "var(--font-playfair-display)" }}
          >
            Twenty minutes is all we need.
          </h2>
          <p className="text-white mb-8">
            One call. We walk the property, build the route, and have service running in 30 days.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { icon: <IconPhone size={20} color="white" stroke={1.5} />, text: "(949) 307-7759" },
              { icon: <IconMail size={20} color="white" stroke={1.5} />, text: "adil.mahmood@valetwastedisposal.com" },
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

        {/* Right — form card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {submitted ? (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: "#52b548" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3
                className="text-xl font-bold text-ink mb-2"
                style={{ fontFamily: "var(--font-playfair-display)" }}
              >
                Request received!
              </h3>
              <p className="text-ink-mid">We&apos;ll be in touch within one business day.</p>
            </div>
          ) : (
            <>
              <h3
                className="text-xl font-bold text-ink mb-1"
                style={{ fontFamily: "var(--font-playfair-display)" }}
              >
                Request a Free Quote
              </h3>
              <p className="text-ink-mid text-sm mb-6">We&apos;ll follow up within one business day.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-ink-mid">Your Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gray-400"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-ink-mid">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gray-400"
                      placeholder="jane@realty.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink-mid">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gray-400"
                    placeholder="(619) 555-0100"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink-mid">Property Name</label>
                  <input
                    value={form.property_name}
                    onChange={(e) => setForm({ ...form, property_name: e.target.value })}
                    className="border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gray-400"
                    placeholder="Sunset Ridge Apartments"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-ink-mid">Anything else?</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-gray-400 resize-none"
                    placeholder="Unit count, service concerns, current vendor issues…"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#1a3a2a" }}
                >
                  Request a Free Quote →
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
