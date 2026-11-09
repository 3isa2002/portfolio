"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { QUERIES, useReducedMotion } from "@/lib/motion/media";
import { INTRO_START, onFirstInteraction, whenIdle } from "@/lib/motion/wake";
import { type BackgroundLevel, pickLevel, stepDown } from "@/lib/three/levels";

// three + R3F + drei + postprocessing live in this chunk only (SPEC §8: after first paint, no SSR).
const NetworkScene = dynamic(() => import("./NetworkScene"), { ssr: false });

/**
 * Background layer, mounted once in the root layout behind everything.
 *
 * The static gradient + noise is always there: it is the first paint, the reduced-motion
 * version, and the fallback for devices without WebGL (or whose context keeps getting lost). A
 * device that cannot hold 45 fps gets a lighter scene, never the static one. The 3D scene
 * is decided on the first interaction (or after a few seconds), loaded when the browser is idle,
 * and fades in over the static layer once its first frame is drawn.
 */
export function BackgroundLayer() {
  const reduced = useReducedMotion();
  const [level, setLevel] = useState<BackgroundLevel | null>(null);
  const [interactive, setInteractive] = useState(false);
  const [shown, setShown] = useState(false);
  /** Bumped to rebuild the canvas after a lost WebGL context (twice at most, then static). */
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let cancelIdle = () => {};
    // Desktops start loading as the boot intro begins, so the network is there when the page
    // appears; phones wait for the first interaction (or the timer), never during the intro.
    const fine = window.matchMedia(QUERIES.finePointer).matches;
    const cancelWake = onFirstInteraction(
      () => {
        cancelIdle = whenIdle(() => {
          setInteractive(fine);
          setLevel((current) => current ?? pickLevel(fine));
        }, 1500);
      },
      4000,
      fine ? [INTRO_START] : [],
    );
    return () => {
      cancelWake();
      cancelIdle();
    };
  }, [reduced]);

  const sceneLevel = !reduced && level && level !== "off" ? level : null;

  return (
    <div aria-hidden className="bg-scene">
      <div className="bg-static" />
      {sceneLevel && (
        <div className="bg-canvas" data-on={shown || undefined} data-level={sceneLevel}>
          <NetworkScene
            key={generation}
            level={sceneLevel}
            interactive={interactive}
            onReady={() => setShown(true)}
            onDecline={() => setLevel(stepDown)}
            onLost={() => {
              setShown(false);
              if (generation >= 2) setLevel("off");
              else setGeneration((g) => g + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
