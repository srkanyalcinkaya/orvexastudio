"use client";

import { animate, utils } from "animejs";
import { useEffect, useRef } from "react";

export function AnimatedFadeIn({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    animate(utils.$(rootRef.current), {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
      easing: "outExpo",
    });
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
