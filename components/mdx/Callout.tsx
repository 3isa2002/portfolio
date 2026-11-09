import type { ReactNode } from "react";

type CalloutProps = {
  children: ReactNode;
  /** info = cyan, note = violet. */
  tone?: "info" | "note";
};

/** Highlighted aside inside a case study: `<Callout>…</Callout>` in MDX. */
export function Callout({ children, tone = "info" }: CalloutProps) {
  return (
    <aside
      className={`rounded-card border-s-2 bg-bg-elev px-5 py-4 text-sm ${
        tone === "note" ? "border-violet" : "border-cyan"
      }`}
    >
      {children}
    </aside>
  );
}
