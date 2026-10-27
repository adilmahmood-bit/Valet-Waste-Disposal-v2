import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Gate codes are stored AES-256-GCM encrypted and only decrypted for the admin route list.
// GATE_CODE_KEY is 32 random bytes, base64 encoded.
function key() {
  const k = process.env.GATE_CODE_KEY;
  if (!k) throw new Error("GATE_CODE_KEY is not set in .env.local");
  const buf = Buffer.from(k, "base64");
  if (buf.length !== 32) throw new Error("GATE_CODE_KEY must be 32 bytes, base64 encoded");
  return buf;
}

export function encryptGateCode(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decryptGateCode(stored: string | null) {
  if (!stored) return null;
  try {
    const [iv, tag, data] = stored.split(".").map((s) => Buffer.from(s, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "(unreadable)";
  }
}
