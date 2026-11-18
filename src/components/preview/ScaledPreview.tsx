"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Renders children at a fixed design width and scales them down to fit. */
export function ScaledPreview({
  children,
  designWidth = 1200,
  height = 260,
}: {
  children: ReactNode;
  designWidth?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / designWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [designWidth]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      inert
      className="relative overflow-hidden"
      style={{ height }}
    >
      <div
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
