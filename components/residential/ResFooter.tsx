import Link from "next/link";
import { residential } from "@/config/residential";

export default function ResFooter() {
  const { contact } = residential;
  return (
    <footer className="bg-res-navy text-white/80 text-sm pb-24 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-white">Valet Waste Disposal</p>
          <p className="mt-1">Locally owned in San Diego.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Call or text us</p>
          <p className="mt-1">
            <a href={`tel:${contact.phoneHref}`} className="hover:text-white">{contact.phone}</a>
          </p>
          <p>
            <a href={`mailto:${contact.email}`} className="hover:text-white break-all">{contact.email}</a>
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Link href="/residential/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/residential/service-area" className="hover:text-white">Service area</Link>
          <Link href="/residential/faq" className="hover:text-white">FAQ</Link>
          <Link href="/residential/terms" className="hover:text-white">Service terms</Link>
          <Link href="/" className="hover:text-white">Apartment communities</Link>
        </div>
      </div>
    </footer>
  );
}
