import localFont from "next/font/local";

// Self-hosted copies of the Google fonts (latin subset), so builds never download from
// Google. Hostinger's build server sometimes gets an unusable response from Google Fonts,
// which fails the whole build. All four are licensed under the SIL Open Font License.

export const playfair = localFont({
  variable: "--font-playfair-display",
  src: [
    { path: "./playfair-display-normal-400-900.woff2", weight: "400 900", style: "normal" },
    { path: "./playfair-display-italic-400-900.woff2", weight: "400 900", style: "italic" },
  ],
});

export const libreFranklin = localFont({
  variable: "--font-libre-franklin",
  src: "./libre-franklin-normal-500-800.woff2",
  weight: "500 800",
});

export const dmSans = localFont({
  variable: "--font-dm-sans",
  src: "./dm-sans-normal-300-700.woff2",
  weight: "300 700",
});

export const poppins = localFont({
  src: [
    { path: "./poppins-normal-400.woff2", weight: "400" },
    { path: "./poppins-normal-500.woff2", weight: "500" },
    { path: "./poppins-normal-600.woff2", weight: "600" },
    { path: "./poppins-normal-700.woff2", weight: "700" },
  ],
});
