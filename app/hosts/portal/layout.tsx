import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Host Portal | Doorstep Disposal",
  description: "Click through the Doorstep Disposal portal for Airbnb and Vrbo hosts and property managers: every property, every can, with photo proof.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1B4F72",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function HostDemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="text-[#1A1A1A]">{children}</div>;
}
