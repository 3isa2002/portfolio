"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

/** Copies the email and shows a short "copied" toast (SPEC §5.6). The toast is announced politely. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (permissions, insecure context): fall back to the mail client.
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className="btn btn-ghost">
        {copied ? (
          <Check size={16} aria-hidden className="text-ok" />
        ) : (
          <Copy size={16} aria-hidden />
        )}
        {t.contact.copyEmail}
      </button>
      <div
        role="status"
        aria-live="polite"
        className={`card fixed bottom-6 start-1/2 z-50 -translate-x-1/2 px-4 py-2.5 font-mono text-sm transition-opacity duration-200 rtl:translate-x-1/2 ${
          copied ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {copied && (
          <>
            <span className="text-ok">✓</span> {t.contact.copied}
          </>
        )}
      </div>
    </>
  );
}
