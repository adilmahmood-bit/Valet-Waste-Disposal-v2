import type { Metadata } from "next";
import ProofView from "./ProofView";

export const metadata: Metadata = {
  title: "Doorstep Disposal - Trash-to-Curb | Service Verification Report",
  robots: { index: false, follow: false },
};

// Read-only proof report a host can share with a neighbor, HOA or city inspector.
export default async function ProofPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const q = await searchParams;
  return <ProofView slug={slug} from={q.from} to={q.to} photos={q.photos !== "0"} print={q.print === "1"} />;
}
