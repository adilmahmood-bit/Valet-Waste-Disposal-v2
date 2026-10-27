import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import ResHeader from "@/components/residential/ResHeader";
import ResFooter from "@/components/residential/ResFooter";
import PlaceholderBanner from "@/components/residential/PlaceholderBanner";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Bin Valet for Homes | Valet Waste Disposal San Diego", template: "%s | Valet Waste Disposal For Homes" },
  description: "Weekly trash bin valet for San Diego homes. We roll your bins to the curb the evening before pickup and bring them back after.",
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
