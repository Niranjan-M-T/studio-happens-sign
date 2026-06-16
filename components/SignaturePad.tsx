"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import SignaturePadLib from "signature_pad";

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toPng: () => string;
}

interface Props {
  className?: string;
}

/** Thin React wrapper over signature_pad. Height is controlled via className. */
const SignaturePad = forwardRef<SignaturePadHandle, Props>(
  function SignaturePad({ className = "h-[200px]" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const padRef = useRef<SignaturePadLib | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pad = new SignaturePadLib(canvas, {
        penColor: "#0a0a0c",
        backgroundColor: "rgba(0,0,0,0)", // transparent → clean PDF overlay
        minWidth: 0.8,
        maxWidth: 2.2,
      });
      padRef.current = pad;

      function resize() {
        if (!canvas) return;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        // Use offsetHeight so height is driven by CSS (works for both inline & modal)
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")?.scale(ratio, ratio);
        pad.clear();
      }
      resize();
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
        pad.off();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => padRef.current?.clear(),
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      toPng: () => padRef.current?.toDataURL("image/png") ?? "",
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`sig-pad w-full rounded-lg border border-black/15 bg-white ${className}`}
      />
    );
  },
);

export default SignaturePad;
