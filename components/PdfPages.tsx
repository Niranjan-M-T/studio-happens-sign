"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export interface PageSize {
  width: number; // CSS pixels
  height: number;
}

interface PageInfo {
  cssScale: number;
  cssW: number;
  cssH: number;
}

/**
 * Renders every page of a PDF to a <canvas> at a width that fits the
 * container, and exposes an absolutely-positioned overlay per page so
 * callers can place fields (admin) or highlight them (signer) using
 * normalized 0..1 coordinates. Client-only (pdf.js needs the DOM).
 */
export default function PdfPages({
  url,
  maxWidth = 900,
  className,
  renderOverlay,
  onLoaded,
}: {
  url: string;
  maxWidth?: number;
  className?: string;
  renderOverlay?: (pageIndex: number, size: PageSize) => ReactNode;
  onLoaded?: (numPages: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const infoRef = useRef<PageInfo[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load the document and compute per-page CSS sizes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        pdfRef.current = doc;

        const containerW = containerRef.current?.clientWidth || maxWidth;
        const targetW = Math.min(containerW, maxWidth);

        const infos: PageInfo[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const cssScale = targetW / base.width;
          infos.push({
            cssScale,
            cssW: targetW,
            cssH: base.height * cssScale,
          });
        }
        if (cancelled) return;
        infoRef.current = infos;
        canvasRefs.current = new Array(infos.length).fill(null);
        setPages(infos);
        onLoaded?.(doc.numPages);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load PDF.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, maxWidth]);

  // Paint each page once its canvas is mounted.
  useEffect(() => {
    const doc = pdfRef.current;
    if (!doc || pages.length === 0) return;
    let cancelled = false;
    const tasks: { cancel: () => void }[] = [];

    (async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let i = 0; i < pages.length; i++) {
        const canvas = canvasRefs.current[i];
        if (!canvas) continue;
        const page = await doc.getPage(i + 1);
        if (cancelled) return;
        const vp = page.getViewport({ scale: pages[i].cssScale * dpr });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        canvas.style.width = `${pages[i].cssW}px`;
        canvas.style.height = `${pages[i].cssH}px`;
        const task = page.render({ canvas, viewport: vp });
        tasks.push(task);
        try {
          await task.promise;
        } catch {
          /* render cancelled */
        }
        if (cancelled) return;
      }
    })();

    return () => {
      cancelled = true;
      tasks.forEach((t) => {
        try {
          t.cancel();
        } catch {
          /* noop */
        }
      });
    };
  }, [pages]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        Couldn’t load the document: {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      {pages.map((info, i) => (
        <div
          key={i}
          className="relative mx-auto mb-4 bg-white shadow-md ring-1 ring-black/5"
          style={{ width: info.cssW, height: info.cssH }}
        >
          <canvas
            ref={(el) => {
              canvasRefs.current[i] = el;
            }}
            className="absolute inset-0"
          />
          {renderOverlay?.(i, { width: info.cssW, height: info.cssH })}
        </div>
      ))}
      {pages.length === 0 && (
        <div className="py-12 text-center text-sm text-black/50">
          Loading document…
        </div>
      )}
    </div>
  );
}
