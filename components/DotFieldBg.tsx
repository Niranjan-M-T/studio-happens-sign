"use client";

import dynamic from "next/dynamic";

// Load DotField client-only (ssr:false) for two reasons:
// 1. It uses canvas + requestAnimationFrame — browser-only APIs.
// 2. It generates a Math.random() SVG gradient id, which would differ
//    between the server render and client hydration causing a mismatch.
const DotField = dynamic(() => import("./DotField"), { ssr: false }) as React.ComponentType<Record<string, unknown>>;

/**
 * Full-bleed DotField background. Place inside a `relative` container;
 * it stretches to cover it absolutely. Configured with Studio Happens
 * brand colors — accent pink on ink.
 */
export default function DotFieldBg() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <DotField
        dotRadius={2}
        dotSpacing={12}
        bulgeStrength={80}
        glowRadius={200}
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="rgba(252, 34, 101, 0.50)"
        gradientTo="rgba(194, 14, 71, 0.28)"
        glowColor="#0a0a0c"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
