import { db } from "./db";

// Visit photos live in the private "visit-photos" bucket. res_visits.photo_url stores
// "storage:visit-photos/<path>"; pages turn that into a short-lived signed URL.

const BUCKET = "visit-photos";
const PREFIX = `storage:${BUCKET}/`;

// A copy of a JPEG with its EXIF orientation tag set to 1 ("show the pixels as stored").
// The Routific driver app's camera is locked to portrait, so it tags every photo "rotate 90°",
// but Adil shoots roll-outs with the phone sideways: the pixels are already upright and the tag
// makes browsers turn them on their side. Only the tag changes; the image isn't re-encoded.
export function uprightJpeg(input: Buffer | Uint8Array) {
  const buf = Buffer.from(input);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return buf;
  let i = 2;
  while (i + 4 <= buf.length && buf[i] === 0xff) {
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker === 0xda) break; // image data starts: no EXIF before it
    if (marker === 0xe1 && buf.toString("latin1", i + 4, i + 8) === "Exif") {
      const t = i + 10;
      const le = buf.toString("latin1", t, t + 2) === "II";
      const u16 = (o: number) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
      const u32 = (o: number) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
      const ifd = t + u32(t + 4);
      if (ifd + 2 > buf.length) break;
      for (let n = 0; n < u16(ifd); n++) {
        const e = ifd + 2 + n * 12;
        if (e + 12 > buf.length) break;
        if (u16(e) === 0x0112) {
          if (le) buf.writeUInt16LE(1, e + 8);
          else buf.writeUInt16BE(1, e + 8);
        }
      }
      break;
    }
    i += 2 + len;
  }
  return buf;
}

export async function saveVisitPhoto(path: string, bytes: Buffer | Uint8Array, contentType = "image/jpeg") {
  const { error } = await db().storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return `${PREFIX}${path}`;
}

// Signed URLs for any stored photos in `urls` (other values pass through unchanged).
export async function resolvePhotoUrls(urls: (string | null)[], expiresIn = 3600): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const stored = [...new Set(urls.filter((u): u is string => !!u && u.startsWith(PREFIX)))];
  for (const u of urls) if (u && !u.startsWith(PREFIX)) out.set(u, u);
  if (!stored.length) return out;
  const { data, error } = await db()
    .storage.from(BUCKET)
    .createSignedUrls(stored.map((u) => u.slice(PREFIX.length)), expiresIn);
  if (error) {
    console.error("[photos] signing failed", error.message);
    return out;
  }
  data?.forEach((d, i) => d.signedUrl && out.set(stored[i], d.signedUrl));
  return out;
}
