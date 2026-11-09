"use client";

import { Box } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { QUERIES } from "@/lib/motion/media";
import { whenIdle } from "@/lib/motion/wake";
import { hasWebGL } from "@/lib/three/levels";
import type { Hotspot } from "./Board3DScene";

// three + R3F + drei: only fetched when the board is near the viewport (SPEC §6 "loads lazily").
const Board3DScene = dynamic(() => import("./Board3DScene"), {
  ssr: false,
  loading: () => <Status text={t.board.loading} />,
});

type Board3DProps = {
  /** `.glb` URL, resolved by the case-study page. Empty: a placeholder board is drawn. */
  src: string;
  hotspots?: Hotspot[];
};

/**
 * Interactive 3D board for hardware case studies (SPEC §6): orbit (drag), zoom (buttons or
 * pinch), and pins that label components. Mouse wheel scrolling is left to the page.
 * On touch screens the board starts locked, so a swipe still scrolls the page, until the
 * visitor taps "explore". Without WebGL a short note replaces it.
 */
export function Board3D({ src, hotspots = [] }: Board3DProps) {
  const frame = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [touch, setTouch] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    // The server can't know the device, so this is synced once after hydration.
    setTouch(!window.matchMedia(QUERIES.finePointer).matches);
    let cancelIdle = () => {};
    // Creating even a test WebGL context can take a second on a weak GPU, so the check (and
    // the 3D chunk) wait until the board is close to the viewport and the browser is idle.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        cancelIdle = whenIdle(() => {
          const ok = hasWebGL();
          setWebgl(ok);
          setNear(ok);
        });
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelIdle();
    };
  }, []);

  const interactive = !touch || unlocked;

  return (
    <div
      ref={frame}
      className="not-prose board3d card relative aspect-[4/3] overflow-hidden sm:aspect-[16/9]"
      data-cursor={interactive ? "drag" : undefined}
      data-lenis-prevent
      role="group"
      aria-label={t.board.label}
    >
      {!webgl ? (
        <Status text={t.board.fallback} />
      ) : near ? (
        <Board3DScene src={src} hotspots={hotspots} interactive={interactive} />
      ) : (
        <Status text={t.board.loading} />
      )}
      {webgl && touch && !unlocked && (
        <button
          type="button"
          onClick={() => setUnlocked(true)}
          className="btn btn-ghost absolute bottom-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
        >
          <Box size={16} aria-hidden />
          {t.board.explore}
        </button>
      )}
    </div>
  );
}

function Status({ text }: { text: string }) {
  return (
    <p className="absolute inset-0 grid place-items-center p-6 text-center font-mono text-xs text-dim">
      {text}
    </p>
  );
}
