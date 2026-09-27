// Illustrated stand-ins for attendant photos so the photo report has history
// before anyone takes a real picture in the demo.

export type PhotoKind = "violation" | "bulk" | "pad";

// Clean trash enclosure: swept concrete pad, compactor with a level load.
function padSvg(seed: number) {
  const wall = ["#b9b2a6", "#a9b0a8", "#c1b7a8"][seed % 3];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#dfe6ea"/>
    <rect x="0" y="60" width="400" height="160" fill="${wall}"/>
    <path d="M0 60 H400" stroke="#8f887d" stroke-width="6"/>
    <rect x="0" y="210" width="400" height="90" fill="#c9c6bf"/>
    <path d="M0 250 H400 M130 210 L110 300 M270 210 L290 300" stroke="#b5b1a9" stroke-width="2"/>
    <rect x="60" y="100" width="190" height="115" rx="6" fill="#2f6b4f"/>
    <rect x="60" y="100" width="190" height="16" rx="4" fill="#24553f"/>
    <rect x="76" y="126" width="158" height="24" fill="#3c3c3c"/>
    <path d="M78 138 H232" stroke="#555" stroke-width="3"/>
    <rect x="250" y="128" width="46" height="87" rx="4" fill="#6c757d"/>
    <rect x="258" y="140" width="30" height="16" rx="2" fill="#d9e2e8"/>
    <circle cx="273" cy="178" r="6" fill="#c0392b"/>
    <rect x="320" y="150" width="46" height="65" rx="5" fill="#1f5e9e"/>
    <rect x="316" y="146" width="54" height="10" rx="3" fill="#184b7e"/>
  </svg>`;
}

const WALLS = ["#d9d3c7", "#cfd6dc", "#e0d6c8", "#d4d9cf"];
const DOORS = ["#7a5a3c", "#35526b", "#6b6f73", "#8a4f3a"];

function svg(kind: PhotoKind, seed: number) {
  if (kind === "pad") return padSvg(seed);
  const wall = WALLS[seed % WALLS.length];
  const door = DOORS[(seed >> 1) % DOORS.length];
  const bag = kind === "violation" && seed % 2 ? "#3a3a3a" : "#2b2b2b";
  const floor = "#9c948a";

  const doorG = `
    <rect x="0" y="0" width="400" height="300" fill="${wall}"/>
    <rect x="0" y="230" width="400" height="70" fill="${floor}"/>
    <rect x="120" y="40" width="130" height="192" fill="${door}" rx="3"/>
    <rect x="112" y="34" width="146" height="200" fill="none" stroke="#f5f1ea" stroke-width="8"/>
    <circle cx="232" cy="140" r="5" fill="#d6c9a8"/>
    <rect x="160" y="62" width="50" height="16" rx="2" fill="#f5f1ea"/>`;

  let items = "";
  if (kind === "violation") {
    items =
      seed % 2
        ? // leaking / untied bag
          `<path d="M60 260 Q52 205 82 190 L96 176 L110 190 Q138 205 130 260 Z" fill="${bag}"/>
           <path d="M86 176 L78 160 M104 176 L114 158" stroke="${bag}" stroke-width="6" stroke-linecap="round"/>
           <ellipse cx="96" cy="272" rx="60" ry="9" fill="#5d4a2e" opacity="0.55"/>`
        : // loose trash, no bag
          `<rect x="54" y="222" width="46" height="36" fill="#c8a877" transform="rotate(-8 77 240)"/>
           <circle cx="118" cy="252" r="10" fill="#e8e1d2"/><rect x="132" y="238" width="16" height="22" fill="#b33" rx="3"/>
           <path d="M40 262 h110" stroke="#000" stroke-opacity="0.08" stroke-width="10"/>`;
  } else {
    // bulk: couch + boxes by a dumpster enclosure
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#cfd8d2"/><rect y="210" width="400" height="90" fill="#a8a196"/>
      <rect x="250" y="70" width="140" height="150" fill="#7d8a80"/><rect x="250" y="70" width="140" height="12" fill="#5f6b62"/>
      <rect x="30" y="170" width="190" height="60" rx="10" fill="#6b5b4d"/>
      <rect x="30" y="140" width="190" height="45" rx="12" fill="#7d6a59"/>
      <rect x="18" y="160" width="30" height="72" rx="10" fill="#5e4f42"/><rect x="202" y="160" width="30" height="72" rx="10" fill="#5e4f42"/>
      <rect x="150" y="${190 - (seed % 3) * 6}" width="60" height="44" fill="#c8a877"/><rect x="176" y="200" width="46" height="34" fill="#b8955f"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${doorG}${items}</svg>`;
}

export function samplePhoto(kind: PhotoKind, seed: number) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg(kind, seed))}`;
}
