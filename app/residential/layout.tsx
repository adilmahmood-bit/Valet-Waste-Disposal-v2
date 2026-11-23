import type { Metadata } from "next";
import { poppins } from "@/app/fonts/fonts";
import ResHeader from "@/components/residential/ResHeader";
import ResFooter from "@/components/residential/ResFooter";
import PlaceholderBanner from "@/components/residential/PlaceholderBanner";

// Picture shown when a residential page is shared (iMessage, Facebook, Slack, etc.).
const shareImage = {
  url: "/residential-hero-ranch.jpg",
  width: 1792,
  height: 1008,
  alt: "Trash, recycling and green waste cans at the curb in front of a San Diego home",
};

// Titles and descriptions use the phrases people search for: trash can valet, valet trash, bin to curb.
export const metadata: Metadata = {
  title: { default: "Trash Can Valet San Diego & North County | Doorstep Disposal", template: "%s | Doorstep Disposal" },
  description: "Trash can valet for San Diego and North County homes. Every week we roll your trash, recycling and green waste cans to the curb and bring them back.",
  openGraph: { siteName: "Doorstep Disposal", locale: "en_US", type: "website", images: [shareImage] },
  twitter: { card: "summary_large_image" },
};

export default function ResidentialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${poppins.className} bg-white text-res-navy min-h-screen text-[17px] md:text-base`}>
      <PlaceholderBanner />
      <ResHeader />
      {children}
      <ResFooter />
    </div>
  );
}
