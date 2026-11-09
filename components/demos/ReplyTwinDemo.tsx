"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { replyTwinDemo } from "@/content/demos/reply-twin";
import { t } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/motion/media";

type Message = { id: number; from: "them" | "me"; text: string; done: boolean };

const s = t.demos.replyTwin;

/**
 * Reply Twin demo (SPEC §6): a WhatsApp-style chat. The visitor picks an incoming message; the
 * "bot" shows a typing indicator, then types out the reply the real model drafted for it.
 * Everything is pre-recorded (content/demos/reply-twin.ts): no network, no API.
 * Finished replies are announced to screen readers; the typing itself is not.
 */
export default function ReplyTwinDemo() {
  const reduced = useReducedMotion();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState<number[]>([]);
  const timers = useRef<number[]>([]);
  const nextId = useRef(0);
  const log = useRef<HTMLDivElement>(null);
  const busy = typing || messages.some((m) => !m.done);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [messages, typing, reduced]);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  function pick(i: number) {
    const sample = replyTwinDemo.samples[i];
    if (!sample || busy) return;
    const base = (nextId.current += 2);
    setUsed((u) => [...u, i]);
    setMessages((m) => [...m, { id: base, from: "them", text: sample.incoming, done: true }]);
    later(() => setTyping(true), 500);
    later(() => {
      setTyping(false);
      const full = sample.reply;
      if (reduced) {
        setMessages((m) => [...m, { id: base + 1, from: "me", text: full, done: true }]);
        return;
      }
      setMessages((m) => [...m, { id: base + 1, from: "me", text: "", done: false }]);
      const chars = Array.from(full);
      chars.forEach((_, k) =>
        later(() => {
          const done = k === chars.length - 1;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === base + 1 ? { ...msg, text: chars.slice(0, k + 1).join(""), done } : msg,
            ),
          );
        }, k * 22),
      );
    }, 1700);
  }

  function reset() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setMessages([]);
    setTyping(false);
    setUsed([]);
  }

  return (
    <section aria-label={s.title} className="flex flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-bg-elev-2 px-4 py-3">
        <span
          aria-hidden
          className="grid size-9 place-items-center rounded-full bg-violet/25 font-display text-sm font-semibold text-violet-ink"
        >
          {replyTwinDemo.contact.slice(0, 1)}
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">{replyTwinDemo.contact}</p>
          <p className="font-mono text-[11px] text-ok">{typing ? s.typing : s.online}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="lightbox-btn ms-auto"
          aria-label={s.reset}
          disabled={messages.length === 0}
        >
          <RotateCcw size={16} aria-hidden />
        </button>
      </header>

      <div
        ref={log}
        className="chat-log flex h-72 flex-col gap-2 overflow-y-auto px-4 py-4 sm:h-80"
        data-lenis-prevent
      >
        {messages.map((m) => (
          <p
            key={m.id}
            className={`chat-bubble ${m.from === "me" ? "chat-me" : "chat-them"}`}
            aria-live={m.from === "me" && m.done ? "polite" : undefined}
          >
            {m.text}
            {!m.done && <span aria-hidden className="caret" />}
          </p>
        ))}
        {typing && (
          <p className="chat-bubble chat-me chat-typing" aria-label={s.typing}>
            <span />
            <span />
            <span />
          </p>
        )}
      </div>

      <div className="border-t border-line p-4">
        <p className="label mb-3 text-dim">{s.pick}</p>
        <div className="flex flex-col gap-2">
          {replyTwinDemo.samples.map((sample, i) => (
            <button
              key={sample.incoming}
              type="button"
              onClick={() => pick(i)}
              disabled={busy || used.includes(i)}
              className="chip min-h-11 justify-start text-start text-sm text-text hover:border-violet/50 disabled:opacity-40"
            >
              {sample.incoming}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-dim">{s.note}</p>
      </div>
    </section>
  );
}
