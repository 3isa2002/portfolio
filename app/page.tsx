// Phase 0 placeholder: proves the pipeline (fonts, tokens, static export, deploy).
// Replaced by the real home sections in Phase 1.
// TODO(mohamed): this whole page is a placeholder.
export default function Home() {
  return (
    <main className="container-site flex min-h-dvh flex-col justify-center gap-8 py-24">
      <p className="label text-dim">
        <span className="text-ok">●</span> phase 0 · pipeline online
      </p>
      <h1 className="text-display font-bold">
        <span className="text-gradient">MOHAMED EISSA</span>
      </h1>
      <p className="max-w-xl text-dim">
        From Silicon to Intelligence. Embedded &amp; IoT hardware meets Generative AI. The full site
        is under construction.
      </p>
      <p className="font-mono text-sm text-dim">
        <span className="text-cyan">&gt;</span> next: layout and content model
      </p>
    </main>
  );
}
