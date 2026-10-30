"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs `tick` every `ms` while the section is visible, the tab is in the foreground, the visitor is not pointing at
 * or focusing inside it, and they have not paused it. Visitors who ask for reduced motion start paused.
 */
export function useRotation(tick: () => void | Promise<void>, ms = 15_000) {
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const [onScreen, setOnScreen] = useState(true);
  const node = useRef<HTMLElement | null>(null);
  const latest = useRef(tick);
  latest.current = tick;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const attach = useCallback((element: HTMLElement | null) => {
    node.current = element;
  }, []);

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)), { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const running = !paused && !hovered && visible && onScreen;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => void latest.current(), ms);
    return () => window.clearInterval(timer);
  }, [running, ms]);

  const hover = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocusCapture: () => setHovered(true),
    onBlurCapture: () => setHovered(false),
  };
  return { paused, setPaused, running, attach, hover };
}
