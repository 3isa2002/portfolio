"use client";

// Direct file import: the drei barrel would pull far more into the chunk than this one component.
import { PerformanceMonitor } from "@react-three/drei/core/PerformanceMonitor";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { lazy, type RefObject, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Group,
  MathUtils,
  type PerspectiveCamera,
  type ShaderMaterial,
  Vector2,
} from "three";
import { INTRO_DONE } from "@/lib/motion/wake";
import { LEVELS, SCENE_COLORS, type SceneLevel } from "@/lib/three/levels";
import { buildNetwork } from "@/lib/three/network";
import { linesFragment, linesVertex, pointsFragment, pointsVertex } from "@/lib/three/shaders";

/**
 * The persistent 3D background (SPEC §7): a particle network that is a circuit board in the top
 * sections and a neural network from Projects down, driven by scroll. Loaded lazily by
 * `BackgroundLayer`, never server-rendered.
 *
 * Frame budget: rendering is driven by our own rAF loop capped at 60 fps (`frameloop="never"`),
 * which also stops while the tab is hidden. drei's PerformanceMonitor reports < 45 fps for 3 s
 * to the parent, which steps the quality down (never below `lite`).
 */
export default function NetworkScene({
  level,
  interactive,
  onReady,
  onDecline,
  onLost,
}: {
  level: SceneLevel;
  /** Mouse/trackpad: nodes react to the cursor. */
  interactive: boolean;
  onReady: () => void;
  onDecline: () => void;
  /** The browser dropped the WebGL context (GPU reset, driver switch, too many contexts). */
  onLost: () => void;
}) {
  const config = LEVELS[level];
  const inputs = useSceneInputs(interactive);

  return (
    <Canvas
      frameloop="never"
      dpr={config.dpr}
      flat
      linear
      camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 40 }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onLost();
          },
          { once: true },
        );
      }}
    >
      <color attach="background" args={[SCENE_COLORS.bg]} />
      <FrameLimiter fps={60} />
      {/* Restarted (with its warm-up) after every step; `lite` is the floor, so nothing to watch. */}
      {level !== "lite" && <Monitor key={level} onDecline={onDecline} />}
      <Network count={config.count} inputs={inputs} />
      {config.bloom && (
        <Suspense fallback={null}>
          <BloomPass />
        </Suspense>
      )}
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
}

const BloomPass = lazy(() => import("./BloomPass"));

const CAMERA_Z = 10;
const FOV = 50;

type Inputs = {
  /** 0 = circuit, 1 = neural. */
  morph: number;
  /** Full in the hero, dimmer behind content so text stays easy to read. */
  intensity: number;
  /** Pointer in normalized device coordinates (-1..1). */
  px: number;
  py: number;
  pointerActive: boolean;
};

/**
 * Scroll and pointer state, kept in a ref (no React re-renders). The morph runs from circuit to
 * neural between the About section reaching the top and Projects reaching mid-screen; pages
 * without those sections use the route (project pages are neural).
 */
function useSceneInputs(interactive: boolean): RefObject<Inputs> {
  const pathname = usePathname();
  const inputs = useRef<Inputs>({ morph: 0, intensity: 1, px: 0, py: 0, pointerActive: false });

  useEffect(() => {
    let span: { start: number; end: number } | null = null;
    const routeMorph = pathname.startsWith("/projects") ? 1 : 0;

    const measure = () => {
      const about = document.getElementById("about");
      const projects = document.getElementById("projects");
      if (!about || !projects) {
        span = null;
        return;
      }
      const vh = window.innerHeight;
      const top = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
      span = { start: top(about) - vh * 0.2, end: top(projects) - vh * 0.4 };
    };
    const update = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      inputs.current.morph = span
        ? MathUtils.clamp((y - span.start) / Math.max(1, span.end - span.start), 0, 1)
        : routeMorph;
      // Full strength only behind the home hero; dimmer behind content everywhere else.
      const hero = span ? 1 - 0.45 * MathUtils.clamp(y / (vh * 0.8), 0, 1) : 0.38;
      inputs.current.intensity = hero;
    };
    let timer: number | undefined;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        measure();
        update();
      }, 150);
    });
    measure();
    update();
    observer.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("scroll", update);
    };
  }, [pathname]);

  useEffect(() => {
    if (!interactive) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      inputs.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      inputs.current.py = -((e.clientY / window.innerHeight) * 2 - 1);
      inputs.current.pointerActive = true;
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) inputs.current.pointerActive = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
    };
  }, [interactive]);

  return inputs;
}

function Network({ count, inputs }: { count: number; inputs: RefObject<Inputs> }) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const group = useRef<Group>(null);
  const pointsMaterial = useRef<ShaderMaterial>(null);
  const linesMaterial = useRef<ShaderMaterial>(null);

  // Visible half-extent of the z = 0 plane; the aspect is bucketed so small resizes keep the layout.
  const halfH = Math.tan(MathUtils.degToRad(camera.fov / 2)) * CAMERA_Z;
  const aspect = Math.round((size.width / Math.max(1, size.height)) * 8) / 8;
  const halfW = halfH * aspect;

  const net = useMemo(() => buildNetwork(count, halfW * 1.08, halfH * 1.08), [count, halfW, halfH]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uPointerStrength: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: 3.4 },
      uIntensity: { value: 1 },
      uCyan: { value: new Color(SCENE_COLORS.cyan) },
      uViolet: { value: new Color(SCENE_COLORS.violet) },
    }),
    [],
  );

  const points = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(net.circuit, 3));
    g.setAttribute("aNeural", new BufferAttribute(net.neural, 3));
    g.setAttribute("aSeed", new BufferAttribute(net.seeds, 1));
    g.setAttribute("aRole", new BufferAttribute(net.roles, 1));
    return g;
  }, [net]);

  const lines = useMemo(() => {
    const edgeCount = net.kinds.length;
    const circuit = new Float32Array(edgeCount * 6);
    const neural = new Float32Array(edgeCount * 6);
    const otherCircuit = new Float32Array(edgeCount * 6);
    const otherNeural = new Float32Array(edgeCount * 6);
    const seed = new Float32Array(edgeCount * 2);
    const otherSeed = new Float32Array(edgeCount * 2);
    const kind = new Float32Array(edgeCount * 2);
    for (let e = 0; e < edgeCount; e++) {
      const a = net.edges[e * 2] ?? 0;
      const b = net.edges[e * 2 + 1] ?? 0;
      // Vertex 2e is endpoint a (other = b); vertex 2e+1 is endpoint b (other = a).
      for (const [v, self, other] of [
        [e * 2, a, b],
        [e * 2 + 1, b, a],
      ] as const) {
        circuit.set(net.circuit.subarray(self * 3, self * 3 + 3), v * 3);
        neural.set(net.neural.subarray(self * 3, self * 3 + 3), v * 3);
        otherCircuit.set(net.circuit.subarray(other * 3, other * 3 + 3), v * 3);
        otherNeural.set(net.neural.subarray(other * 3, other * 3 + 3), v * 3);
        seed[v] = net.seeds[self] ?? 0;
        otherSeed[v] = net.seeds[other] ?? 0;
        kind[v] = net.kinds[e] ?? 0;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(circuit, 3));
    g.setAttribute("aNeural", new BufferAttribute(neural, 3));
    g.setAttribute("aOtherCircuit", new BufferAttribute(otherCircuit, 3));
    g.setAttribute("aOtherNeural", new BufferAttribute(otherNeural, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    g.setAttribute("aOtherSeed", new BufferAttribute(otherSeed, 1));
    g.setAttribute("aKind", new BufferAttribute(kind, 1));
    return g;
  }, [net]);

  useEffect(() => () => points.dispose(), [points]);
  useEffect(() => () => lines.dispose(), [lines]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const input = inputs.current;
    // Uniforms are updated through the material refs: R3F gives each material its own copy.
    const u = pointsMaterial.current?.uniforms as typeof uniforms | undefined;
    if (!u) return;
    u.uTime.value += dt;
    u.uPixelRatio.value = state.viewport.dpr;
    u.uMorph.value = MathUtils.damp(u.uMorph.value, input.morph, 3, dt);
    u.uIntensity.value = MathUtils.damp(u.uIntensity.value, input.intensity, 4, dt);
    u.uPointerStrength.value = MathUtils.damp(
      u.uPointerStrength.value,
      input.pointerActive ? 1 : 0,
      4,
      dt,
    );
    u.uPointer.value.set(
      MathUtils.damp(u.uPointer.value.x, input.px * halfW, 8, dt),
      MathUtils.damp(u.uPointer.value.y, input.py * halfH, 8, dt),
    );
    const l = linesMaterial.current?.uniforms;
    if (l && l !== u)
      for (const key of Object.keys(u)) if (l[key]) l[key].value = u[key as keyof typeof u].value;

    const g = group.current;
    if (g) {
      g.rotation.y = MathUtils.damp(g.rotation.y, input.px * 0.05 + u.uMorph.value * 0.12, 2, dt);
      g.rotation.x = MathUtils.damp(g.rotation.x, -input.py * 0.03, 2, dt);
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lines} frustumCulled={false}>
        <shaderMaterial
          ref={linesMaterial}
          vertexShader={linesVertex}
          fragmentShader={linesFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
      <points geometry={points} frustumCulled={false}>
        <shaderMaterial
          ref={pointsMaterial}
          vertexShader={pointsVertex}
          fragmentShader={pointsFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Drives rendering at most `fps` times a second; rAF itself pauses in hidden tabs. */
function FrameLimiter({ fps }: { fps: number }) {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const interval = 1000 / fps;
    let last = 0;
    let id = requestAnimationFrame(function loop(t) {
      id = requestAnimationFrame(loop);
      const elapsed = t - last;
      if (elapsed < interval) return;
      last = t - (elapsed % interval);
      advance(t);
    });
    return () => cancelAnimationFrame(id);
  }, [advance, fps]);
  return null;
}

/**
 * Starts sampling once the boot intro is over (it shares the GPU, and its few seconds of load
 * are not the steady state) plus a warm-up for shader compiles and uploads, then reports when
 * 3 s of samples (12 × 250 ms) average under 45 fps.
 */
function Monitor({ onDecline }: { onDecline: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    let timer: number | undefined;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setArmed(true), 2000);
    };
    const introPlaying = () => document.documentElement.dataset.intro === "full";
    if (introPlaying()) window.addEventListener(INTRO_DONE, arm, { once: true });
    else arm();
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(INTRO_DONE, arm);
    };
  }, []);
  if (!armed) return null;
  return (
    <PerformanceMonitor
      ms={250}
      iterations={12}
      threshold={0.75}
      bounds={() => [45, Infinity]}
      onDecline={onDecline}
    />
  );
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}
