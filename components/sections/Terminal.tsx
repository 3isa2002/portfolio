"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { t } from "@/lib/i18n";
import { OVERCLOCK_EVENT } from "@/lib/overclock";

type Line = { id: number; node: ReactNode };

const commands = t.contact.commands;
const names = Object.keys(commands) as (keyof typeof commands)[];
const s = t.contact.terminal;
const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");

function Help() {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 text-dim">
      {names.map((cmd) => (
        <div key={cmd} className="contents">
          <dt className="text-cyan">{cmd}</dt>
          <dd>{commands[cmd]}</dd>
        </div>
      ))}
    </dl>
  );
}

function Prompt({ children }: { children: ReactNode }) {
  return (
    <p>
      <span className="text-ok">$</span> {children}
    </p>
  );
}

/**
 * Contact terminal (SPEC §5.6, §7): type `help`, `email`, `cv`, `github`, `linkedin`,
 * `whatsapp` or `clear`. ↑/↓ walk the command history; Tab completes a partly typed command
 * (an empty prompt lets Tab move focus on as usual, so keyboard users are never trapped).
 * The prerendered HTML already shows the `help` output, so the commands are readable without
 * JavaScript; the buttons beside the terminal do the same things for everyone.
 */
export function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { id: 0, node: <Prompt>help</Prompt> },
    { id: 1, node: <Help /> },
  ]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const nextId = useRef(2);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  const print = (...nodes: ReactNode[]) =>
    setLines((l) => [...l, ...nodes.map((node) => ({ id: nextId.current++, node }))]);

  useEffect(() => {
    const onOverclock = (e: Event) =>
      print((e as CustomEvent<boolean>).detail ? s.overclockOn : s.overclockOff);
    window.addEventListener(OVERCLOCK_EVENT, onOverclock);
    return () => window.removeEventListener(OVERCLOCK_EVENT, onOverclock);
  }, []);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  function open(url: string, name: string) {
    if (!url) return print(fill(s.notSet, { name }));
    print(fill(s.opening, { name }));
    window.open(url, "_blank", "noopener");
  }

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase();
    if (cmd === "clear") {
      setLines([]);
      return;
    }
    print(<Prompt>{raw}</Prompt>);
    switch (cmd) {
      case "":
        return;
      case "help":
        return print(<Help />);
      case "email":
        print(fill(s.emailOut, { email: site.email }));
        window.location.href = `mailto:${site.email}`;
        return;
      case "cv":
        return print(
          s.cvOut,
          <span className="flex flex-col">
            <a href={site.cv.ai} download className="text-cyan underline underline-offset-4">
              {t.hero.cvAi}
            </a>
            <a href={site.cv.embedded} download className="text-cyan underline underline-offset-4">
              {t.hero.cvEmbedded}
            </a>
          </span>,
        );
      case "github":
        return open(site.links.github, t.contact.github);
      case "linkedin":
        return open(site.links.linkedin, t.contact.linkedin);
      case "whatsapp":
        return open(site.links.whatsapp, t.contact.whatsapp);
      default:
        return print(<span className="text-dim">{fill(s.notFound, { cmd })}</span>);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) history.current.push(value.trim());
      cursor.current = -1;
      run(value);
      setValue("");
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const h = history.current;
      if (!h.length) return;
      e.preventDefault();
      const up = e.key === "ArrowUp";
      const i = cursor.current === -1 ? (up ? h.length - 1 : -1) : cursor.current + (up ? -1 : 1);
      cursor.current = Math.max(-1, Math.min(h.length - 1, i));
      setValue(cursor.current === -1 ? "" : (h[cursor.current] ?? ""));
    } else if (e.key === "Tab" && value.trim()) {
      const match = names.filter((n) => n.startsWith(value.trim().toLowerCase()));
      if (match.length === 1 && match[0]) {
        e.preventDefault();
        setValue(match[0]);
      } else if (match.length > 1) {
        e.preventDefault();
        print(<Prompt>{value}</Prompt>, <span className="text-dim">{match.join("  ")}</span>);
      }
    }
  }

  return (
    <div
      className="p-5 font-mono text-sm leading-7 sm:p-6"
      onClick={() => input.current?.focus({ preventScroll: true })}
    >
      <div
        ref={log}
        role="log"
        aria-live="polite"
        className="max-h-72 overflow-y-auto"
        data-lenis-prevent
      >
        {lines.map((l) => (
          <div key={l.id}>{l.node}</div>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2">
        <span className="text-ok" aria-hidden>
          $
        </span>
        <span className="sr-only">{s.label}</span>
        <input
          ref={input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder={s.welcome}
          className="terminal-input min-w-0 flex-1 bg-transparent text-text caret-cyan outline-none placeholder:text-dim/60"
        />
      </label>
    </div>
  );
}
