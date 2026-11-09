import type { Metadata } from "next";
import Link from "next/link";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t.notFound.title,
  robots: { index: false },
};

/** Themed 404 (SPEC §5 routes). Exported as out/404.html, which Cloudflare Pages serves for unknown paths. */
export default function NotFound() {
  return (
    <section className="container-site flex min-h-[80dvh] flex-col justify-center gap-6 pt-24 pb-16">
      <p className="font-mono text-sm text-cyan">{t.notFound.line}</p>
      <h1 className="text-h2 font-semibold">{t.notFound.title}</h1>
      <p className="max-w-md text-dim">{t.notFound.text}</p>
      <p>
        <Link href="/" className="btn btn-ghost">
          {t.notFound.home}
        </Link>
      </p>
    </section>
  );
}
