import type { Metadata } from "next";
import { poppins } from "@/app/fonts/fonts";
import { residential, planById, advertisedPrice, money } from "@/config/residential";
import ResHeader from "@/components/residential/ResHeader";
import ResFooter from "@/components/residential/ResFooter";
import PlaceholderBanner from "@/components/residential/PlaceholderBanner";

// Titles and descriptions use the phrases people search for: bin valet, bin to curb, curbside trash can service.
export const metadata: Metadata = {
  title: { default: "Doorstep Disposal - Trash-to-Curb Service | San Diego & North County", template: "Doorstep Disposal - Trash-to-Curb | %s" },
  description: `Curbside trash can service for homes in San Diego and North County. We take your trash, recycling and green waste cans to the curb the evening before pickup and bring them back after. From ${money(advertisedPrice(planById("weekly")!))}/month with code ${residential.promo.label}.`,
  openGraph: { siteName: "Doorstep Disposal", locale: "en_US", type: "website" },
};

export default function ResidentialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${poppins.className} bg-white text-res-navy min-h-screen`}>
      <PlaceholderBanner />
      <ResHeader />
      {children}
      <ResFooter />
    </div>
  );
}
