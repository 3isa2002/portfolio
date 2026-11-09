"use client";

import { Center } from "@react-three/drei/core/Center";
import { useGLTF } from "@react-three/drei/core/Gltf";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { Html } from "@react-three/drei/web/Html";
import { Canvas, useThree } from "@react-three/fiber";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { type ComponentRef, type RefObject, Suspense, useEffect, useRef, useState } from "react";
import { t } from "@/lib/i18n";
import { useReducedMotion } from "@/lib/motion/media";

export type Hotspot = {
  /** Position in the model's space (the placeholder board is ~4 × 2.6 units). */
  position: [number, number, number];
  label: string;
  note?: string;
};

const CAMERA: [number, number, number] = [3.2, 2.6, 3.6];

/** The 3D view itself; loaded by Board3D only when it is near the viewport. */
export default function Board3DScene({
  src,
  hotspots,
  interactive,
}: {
  src: string;
  hotspots: Hotspot[];
  interactive: boolean;
}) {
  const reduced = useReducedMotion();
  const controls = useRef<Controls>(null);
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: CAMERA, fov: 40 }}
        gl={{ antialias: true }}
        style={{
          touchAction: interactive ? "none" : "pan-y",
          pointerEvents: interactive ? "auto" : "none",
        }}
      >
        <color attach="background" args={["#0b0b12"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 3]} intensity={1.6} />
        <pointLight position={[-3, 2, -2]} intensity={6} color="#22d3ee" />
        <Suspense fallback={null}>
          <Center>{src ? <Model src={src} /> : <PlaceholderBoard />}</Center>
        </Suspense>
        {hotspots.map((h, i) => (
          <Html key={h.label} position={h.position} center zIndexRange={[20, 0]}>
            <div className="board-pin">
              <button
                type="button"
                className="board-pin-dot"
                aria-expanded={active === i}
                aria-label={h.label}
                onClick={() => setActive((a) => (a === i ? null : i))}
              >
                {i + 1}
              </button>
              {active === i && (
                <div className="board-pin-card" role="status">
                  <p className="font-display text-sm font-semibold">{h.label}</p>
                  {h.note && <p className="mt-1 text-xs text-dim">{h.note}</p>}
                </div>
              )}
            </div>
          </Html>
        ))}
        <OrbitControls
          ref={controls}
          makeDefault
          enabled={interactive}
          enableZoom={false}
          enablePan={false}
          autoRotate={!reduced && active === null}
          autoRotateSpeed={0.6}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.05}
        />
        <ZoomBridge controls={controls} />
      </Canvas>

      <div className="absolute end-2 top-2 flex flex-col gap-1">
        <ZoomButton label={t.board.zoomIn} factor={0.82} />
        <ZoomButton label={t.board.zoomOut} factor={1.22} />
        <ZoomButton label={t.board.reset} factor={0} />
      </div>
      <p className="pointer-events-none absolute bottom-2 start-3 font-mono text-[11px] text-dim">
        {t.board.hint}
      </p>
    </>
  );
}

type Controls = ComponentRef<typeof OrbitControls>;

// Zoom buttons live outside the canvas; they reach the camera through this bridge.
let zoomBy: ((factor: number) => void) | null = null;

function ZoomBridge({ controls }: { controls: RefObject<Controls | null> }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    zoomBy = (factor) => {
      if (factor === 0) camera.position.set(...CAMERA);
      else {
        const len = camera.position.length() * factor;
        camera.position.setLength(Math.min(9, Math.max(2.2, len)));
      }
      controls.current?.update();
      invalidate();
    };
    return () => {
      zoomBy = null;
    };
  }, [camera, controls, invalidate]);
  return null;
}

function ZoomButton({ label, factor }: { label: string; factor: number }) {
  const Icon = factor === 0 ? RotateCcw : factor < 1 ? Plus : Minus;
  return (
    <button
      type="button"
      className="lightbox-btn"
      aria-label={label}
      onClick={() => zoomBy?.(factor)}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} />;
}

/** TODO(mohamed): replaced by the real .glb (frontmatter `model3d`). A generic MCU board. */
function PlaceholderBoard() {
  const chips: [number, number, number, number][] = [
    // x, z, width, depth
    [-0.6, 0, 0.9, 0.9],
    [0.9, -0.55, 0.6, 0.45],
    [0.9, 0.55, 0.6, 0.45],
    [-1.55, -0.85, 0.35, 0.25],
  ];
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 2.6]} />
        <meshStandardMaterial color="#0c3b2e" roughness={0.6} metalness={0.1} />
      </mesh>
      {chips.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.11, z]}>
          <boxGeometry args={[w, 0.12, d]} />
          <meshStandardMaterial color="#111318" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`h${i}`} position={[-1.65 + i * 0.3, 0.15, 1.15]}>
          <boxGeometry args={[0.12, 0.2, 0.12]} />
          <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[1.7, 0.1, -1.05]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}
