import type { Metadata, Viewport } from "next";
import { poppins } from "@/app/fonts/fonts";

export const metadata: Metadata = {
  title: { default: "Your account | Doorstep Disposal", template: "%s | Doorstep Disposal" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#1B4F72", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${poppins.className} text-[#1A1A1A]`}>{children}</div>;
}
