"use client";

import { useEffect } from "react";

/**
 * Site-wide restrained motion:
 *  - [data-reveal]   gets `.is-in` once it enters the viewport
 *  - [data-parallax] translates vertically by (offset from viewport centre × factor)
 *  - [data-autoplay] videos play only while visible
 * Everything is disabled under prefers-reduced-motion.
 */
export function MotionController() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduce) {
      reveals.forEach((el) => el.classList.add("is-in"));
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    if (!reduce) reveals.forEach((el) => io.observe(el));

    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]"));
    const vio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && !reduce) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.25 },
    );
    videos.forEach((v) => vio.observe(v));

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of layers) {
        const factor = parseFloat(el.dataset.parallax || "0");
        const rect = el.parentElement!.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        const offset = (rect.top + rect.height / 2 - vh / 2) * factor;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${1 + Math.abs(factor) * 0.9})`;
      }
      root.style.setProperty("--scroll", String(window.scrollY));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    if (!reduce && layers.length) {
      update();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    return () => {
      io.disconnect();
      vio.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
