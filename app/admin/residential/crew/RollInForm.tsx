"use client";
import { useRef, useState } from "react";
import { markRollIn } from "../actions";

// Shrinks a phone photo to at most 1600px on the long side as a JPEG, so it uploads quickly
// on mobile data and stays under the 1 MB server-action limit.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.8, 0.65, 0.5]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size < 900_000) return blob;
  }
  throw new Error("Photo is too large even after shrinking.");
}

export default function RollInForm({ addressId, date }: { addressId: string; date: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(form: FormData, status: "done" | "issue") {
    setBusy(true);
    setError(null);
    try {
      const file = fileRef.current?.files?.[0];
      form.delete("photo");
      if (file) form.set("photo", await shrink(file), "photo.jpg");
      form.set("status", status);
      await markRollIn(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saving failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 space-y-2" onSubmit={(e) => e.preventDefault()}>
      <input type="hidden" name="address_id" value={addressId} />
      <input type="hidden" name="date" value={date} />
      <label className="block">
        <span className="sr-only">Photo of the cans back in</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-res-navy file:text-white file:px-4 file:py-2 file:font-semibold"
        />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {preview && <img src={preview} alt="" className="w-full h-40 object-cover rounded-lg" />}
      <input name="note" placeholder="Note (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => submit(new FormData(e.currentTarget.form!), "done")}
          className="flex-1 rounded-full bg-res-teal-dark text-white font-semibold py-3 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Cans back in"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => submit(new FormData(e.currentTarget.form!), "issue")}
          className="rounded-full border border-amber-400 text-amber-900 font-semibold px-4 py-3 disabled:opacity-50"
        >
          Problem
        </button>
      </div>
    </form>
  );
}
