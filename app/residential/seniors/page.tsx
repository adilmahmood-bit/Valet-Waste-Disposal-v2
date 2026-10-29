import type { Metadata } from "next";
import Link from "next/link";
import { IconUserCheck, IconUsers, IconKey, IconCalendarRepeat } from "@tabler/icons-react";
import { residential, planById } from "@/config/residential";
import ZipCheck from "@/components/residential/ZipCheck";
import StickyCta from "@/components/residential/StickyCta";

export const metadata: Metadata = {
  title: "Trash Can Help for Seniors in San Diego",
  description:
    "Weekly bin valet for older adults in San Diego and North County. We take trash cans to the curb and bring them back, so no one has to move heavy bins. Family members can sign up for a parent.",
  alternates: { canonical: "/residential/seniors" },
};

const points = [
  {
    icon: IconCalendarRepeat,
    title: "Every week, on trash day",
    text: "The evening before pickup, we roll the trash, recycling and green waste bins to the curb. After the truck comes, we put them back.",
  },
  {
    icon: IconUserCheck,
    title: "Background-checked staff",
    text: "The person who comes to the home has passed a background check.",
  },
  {
    icon: IconKey,
    title: "No one needs to be home",
    text: "Tell us where the bins are kept and add a gate code if there is one. Gate codes are stored encrypted.",
  },
  {
    icon: IconUsers,
    title: "Family can set it up",
    text: "Sign up with your parent's address and your own phone number and email. We'll text you, not them, about billing and schedule changes.",
  },
];

export default function SeniorsPage() {
  const { contact } = residential;
  const weekly = planById("weekly")!;
  return (
    <>
      <section className="bg-res-navy text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-10 md:py-16">
          <p className="text-res-teal font-semibold text-xs md:text-sm uppercase tracking-[0.15em]">For seniors and their families</p>
          <h1 className="mt-2 md:mt-3 text-[2rem] md:text-5xl font-bold leading-[1.15]">Help with trash cans, every week.</h1>
          <p className="mt-3 md:mt-4 md:text-lg text-white/85 max-w-2xl">
            Full trash cans are heavy, and driveways can be steep. We take the bins to the curb the evening before trash day and bring
            them back after, so nobody has to.
          </p>
          <div className="mt-6 max-w-md">
            <p className="font-semibold text-sm md:text-base mb-2">Check the ZIP code</p>
            <ZipCheck dark />
            <p className="mt-3 text-sm text-white/75">
              <span className="font-semibold text-white">${weekly.basePrice}/month</span> for up to {weekly.includedBins} bins. Month-to-month.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-2 gap-4 md:gap-6">
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl bg-res-mist p-5 md:p-6">
              <p.icon size={28} className="text-res-teal-dark" aria-hidden="true" />
              <h2 className="mt-3 font-semibold text-lg">{p.title}</h2>
              <p className="mt-1 text-slate-700 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-10 md:pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold">Setting this up for a parent?</h2>
          <ol className="mt-4 space-y-3 text-slate-700 list-decimal list-inside leading-relaxed">
            <li>Check their ZIP code above.</li>
            <li>On the sign-up form, enter their address, trash day and where the bins are kept.</li>
            <li>Choose &quot;Senior household&quot; as the property type, and use your own name, mobile and email.</li>
            <li>We&apos;ll text you to set up billing before the first visit.</li>
          </ol>
          <p className="mt-8 rounded-2xl bg-res-mist p-6 md:text-lg">
            Rather talk it through? Call or text us at{" "}
            <a href={`tel:${contact.phoneHref}`} className="font-semibold text-res-teal-dark whitespace-nowrap">{contact.phone}</a>.
          </p>
          <p className="mt-6 text-sm text-slate-600">
            See <Link href="/residential/pricing" className="font-semibold text-res-teal-dark underline underline-offset-4">pricing</Link> or{" "}
            <Link href="/residential/faq" className="font-semibold text-res-teal-dark underline underline-offset-4">common questions</Link>.
          </p>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
