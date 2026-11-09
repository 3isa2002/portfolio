"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

/**
 * Bloom for the `full` quality level only. Kept in its own chunk (loaded with React.lazy from
 * NetworkScene), so phones and downgraded scenes never download or compile postprocessing.
 */
export default function BloomPass() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.15} intensity={0.85} radius={0.7} />
    </EffectComposer>
  );
}
