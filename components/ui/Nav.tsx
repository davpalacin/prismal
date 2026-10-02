"use client";

import { useEffect, useRef, useState } from "react";
import { nav } from "@/content/site";
import { Wordmark } from "./Wordmark";

/** Which nav entry each page section belongs to (unlisted sections clear the highlight). */
const sectionGroup: Record<string, string> = {
  project: "project",
  world: "world",
  systems: "systems",
  energy: "systems",
  ferrosomas: "world",
  archive: "archive",
  development: "development",
};

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const targets = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(sectionGroup[e.target.id] ?? "");
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`nav ${scrolled ? "nav--scrolled" : ""} ${open ? "nav--open" : ""}`}>
      <a className="skip mono" href="#main">
        Skip to content
      </a>
      <div className="nav__bar">
        <a href="#top" className="nav__brand" aria-label="PRISMAL — back to top" onClick={close}>
          <Wordmark />
        </a>
        <nav className="nav__links" aria-label="Primary">
          <ul>
            {nav.map((n, i) => (
              <li key={n.href}>
                <a href={n.href} className={active === n.href.slice(1) ? "is-active" : ""} aria-current={active === n.href.slice(1) ? "location" : undefined}>
                  <span className="nav__idx mono" aria-hidden="true">
                    0{i + 1}
                  </span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#follow" className="btn btn--ghost btn--sm nav__cta">
          <span aria-hidden="true">[</span> Follow development <span aria-hidden="true">]</span>
        </a>
        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className="nav__burger" aria-hidden="true" />
        </button>
      </div>

      <div id="mobile-menu" className="mnav" hidden={!open}>
        <p className="mnav__label mono">Index // Public access</p>
        <ul>
          {nav.map((n, i) => (
            <li key={n.href}>
              <a href={n.href} onClick={close}>
                <span className="mono">0{i + 1}</span>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#follow" className="btn btn--primary" onClick={close}>
          Follow development
        </a>
        <p className="mnav__foot mono">PRJ-PRSM-001 · Rev. 0.8 · Production status: Active</p>
      </div>
    </header>
  );
}
