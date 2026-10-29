import { IconMessage, IconPhone } from "@tabler/icons-react";
import { residential } from "@/config/residential";

// Bottom bar on phones: jump to the ZIP check, or text/call. Pages using it need a ZipCheck (#check).
export default function StickyCta() {
  const { contact } = residential;
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2.5 flex gap-2">
      <a href="#check" className="flex-1 text-center rounded-full bg-res-teal-dark text-white font-semibold py-3">Check my address</a>
      <a href={`sms:${contact.phoneHref}`} aria-label={`Text ${contact.phone}`} className="grid place-items-center w-12 rounded-full border-2 border-res-navy text-res-navy">
        <IconMessage size={20} aria-hidden="true" />
      </a>
      <a href={`tel:${contact.phoneHref}`} aria-label={`Call ${contact.phone}`} className="grid place-items-center w-12 rounded-full border-2 border-res-navy text-res-navy">
        <IconPhone size={20} aria-hidden="true" />
      </a>
    </div>
  );
}
