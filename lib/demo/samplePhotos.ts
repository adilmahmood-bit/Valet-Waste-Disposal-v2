// Illustrated stand-ins for attendant photos so the photo report has history
// before anyone takes a real picture in the demo.

export type PhotoKind = "proof" | "violation" | "bulk";

const WALLS = ["#d9d3c7", "#cfd6dc", "#e0d6c8", "#d4d9cf"];
const DOORS = ["#7a5a3c", "#35526b", "#6b6f73", "#8a4f3a"];

function svg(kind: PhotoKind, seed: number) {
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
  if (kind === "proof") {
    // Empty doorstep after pickup, with a small QR tag on the frame.
    items = `<rect x="264" y="92" width="22" height="22" fill="#fff"/><rect x="268" y="96" width="6" height="6" fill="#111"/><rect x="276" y="104" width="6" height="6" fill="#111"/><rect x="268" y="106" width="4" height="4" fill="#111"/>
      <ellipse cx="200" cy="262" rx="70" ry="6" fill="#000" opacity="0.08"/>`;
  } else if (kind === "violation") {
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
