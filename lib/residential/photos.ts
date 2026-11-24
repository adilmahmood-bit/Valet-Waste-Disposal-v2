import { db } from "./db";

// Visit photos live in the private "visit-photos" bucket. res_visits.photo_url stores
// "storage:visit-photos/<path>"; pages turn that into a short-lived signed URL.

const BUCKET = "visit-photos";
const PREFIX = `storage:${BUCKET}/`;

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
