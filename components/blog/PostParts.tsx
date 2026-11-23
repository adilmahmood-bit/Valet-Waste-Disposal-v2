import Link from "next/link";
import { residential } from "@/config/residential";
import { formatPostDate as fmt, type Post } from "@/lib/blog";

// Pieces shared by the homeowner blog posts: header, FAQ list and the sign-up box.

export function PostHeader({ post, lede }: { post: Post; lede: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-teal">Home</Link> <span aria-hidden="true">/</span>{" "}
        <Link href="/blog" className="hover:text-teal">Blog</Link>
      </nav>
      <h1 className="font-heading text-4xl sm:text-5xl text-ink mt-4 leading-tight">{post.title}</h1>
      <p className="mt-4 text-lg text-ink-mid">{lede}</p>
      <p className="mt-4 text-sm text-muted">
        Updated <time dateTime={post.updated}>{fmt(post.updated)}</time> · {post.readMinutes} min read
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image.src}
        alt={post.image.alt}
        width={post.image.width}
        height={post.image.height}
        className="mt-8 w-full h-auto rounded-2xl"
      />
    </>
  );
}

export function PostFaqs({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <>
      <h2>Frequently asked questions</h2>
      {faqs.map((f) => (
        <div key={f.q} className="faq">
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </>
  );
}

export function HomesCta({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const { contact } = residential;
  return (
    <div className="mt-12 rounded-3xl bg-navy p-8 sm:p-10 text-white">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-soft">{eyebrow}</p>
      <h2 className="font-heading text-2xl sm:text-3xl mt-2">{title}</h2>
      <p className="mt-3 text-white/85">{text}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/residential/signup" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white">
          Get started
        </Link>
        <Link href="/residential/pricing" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:border-white">
          See pricing
        </Link>
        <a href={`tel:${contact.phoneHref}`} className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:border-white">
          Call or text {contact.phone}
        </a>
      </div>
    </div>
  );
}
