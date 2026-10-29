import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { playfair, libreFranklin, dmSans } from "./fonts/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://yourdoorstepdisposal.com"),
  title: "Valet Waste Disposal | San Diego County",
  description: "Owner-operated valet trash service in San Diego County for apartment property managers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${libreFranklin.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
