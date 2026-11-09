"use client";

import { Check, Copy } from "lucide-react";
import { type ComponentProps, useRef, useState } from "react";
import { t } from "@/lib/i18n";

/**
 * Fenced code blocks in MDX (SPEC §6 "Code highlights"): Shiki's highlighted <pre> (built at
 * build time) inside a frame with a file name tab and a copy button.
 * Write the file name in the fence: ```python title="retrieve.py"
 */
export function CodeBlock({
  children,
  "data-title": title,
  ...props
}: ComponentProps<"pre"> & { "data-title"?: string }) {
  const pre = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pre.current?.textContent ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (insecure context or permission): the code stays selectable.
    }
  }

  return (
    <div className="code-block">
      <div className="code-bar">
        <span className="font-mono text-xs text-dim">{title ?? t.code.file}</span>
        <button type="button" onClick={copy} className="code-copy" aria-label={t.code.copy}>
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          <span role="status" className="font-mono text-xs">
            {copied ? t.code.copied : ""}
          </span>
        </button>
      </div>
      <pre ref={pre} {...props}>
        {children}
      </pre>
    </div>
  );
}
