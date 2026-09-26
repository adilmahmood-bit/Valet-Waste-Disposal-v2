import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Valet Waste Disposal App | Demo",
  description: "Interactive demo of the Valet Waste Disposal attendant, resident, and property manager apps.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1B4F72",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="text-[#1A1A1A]">{children}</div>;
}
