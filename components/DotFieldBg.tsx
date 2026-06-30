"use client";

// DotField is a .jsx file — cast to avoid TypeScript prop inference issues.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import DotFieldRaw from "./DotField";
const DotField = DotFieldRaw as React.ComponentType<Record<string, unknown>>;

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
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <DotField
        dotRadius={1.5}
        dotSpacing={14}
        bulgeStrength={67}
        glowRadius={180}
        sparkle={false}
        waveAmplitude={0}
        gradientFrom="rgba(252, 34, 101, 0.22)"
        gradientTo="rgba(194, 14, 71, 0.10)"
        glowColor="#0a0a0c"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
