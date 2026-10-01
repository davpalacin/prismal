"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { archive, archiveCategories, type ArchiveCategory, type ArchiveItem } from "@/content/site";
import { getAsset } from "@/content/assets";
import { Art } from "./Art";

type Filter = "All" | ArchiveCategory;

function statusClass(s: ArchiveItem["status"]) {
  return `tag tag--${s.toLowerCase().replace(/\s+/g, "-")}`;
}

export function ArchiveBrowser() {
  const [filter, setFilter] = useState<Filter>("All");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const items = useMemo(() => (filter === "All" ? archive : archive.filter((a) => a.category === filter)), [filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { All: archive.length };
    for (const a of archive) c[a.category] = (c[a.category] ?? 0) + 1;
    return c;
  }, []);
  const current = openIdx !== null ? items[openIdx] : null;

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (current && !d.open) {
      d.showModal();
      document.body.classList.add("no-scroll");
    }
    if (!current && d.open) d.close();
  }, [current]);

  const open = (i: number, el: HTMLElement) => {
    returnFocus.current = el;
    setOpenIdx(i);
  };
  const close = () => setOpenIdx(null);
  const step = (dir: number) => setOpenIdx((i) => (i === null ? i : (i + dir + items.length) % items.length));

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIdx, items.length]);

  return (
    <div className="archive">
      <div className="archive__toolbar">
        <div className="archive__filters" role="group" aria-label="Filter archive by category">
          {(["All", ...archiveCategories] as Filter[]).map((c) => (
            <button key={c} type="button" className="chip mono" aria-pressed={filter === c} onClick={() => setFilter(c)} disabled={!counts[c]}>
              {c}
              <span className="chip__n">{String(counts[c] ?? 0).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <p className="archive__count mono" aria-live="polite">
          Showing {String(items.length).padStart(2, "0")} / {String(archive.length).padStart(2, "0")} files · Public index
        </p>
      </div>

      <ul className="archive__grid">
        {items.map((item, i) => (
          <li key={item.id} className={`afile ${item.restricted ? "afile--restricted" : ""}`} style={{ ["--i" as string]: i }}>
            <button type="button" className="afile__btn" onClick={(e) => open(i, e.currentTarget)} aria-haspopup="dialog">
              <div className="afile__media">
                <Art asset={item.asset} code={item.id} sizes="(max-width: 700px) 100vw, 33vw" reveal={false} />
                <div className="afile__overlay mono" aria-hidden="true">
                  <span className="afile__cross" />
                  <span>{item.restricted ? "Access denied" : "Open file"}</span>
                  <span>{item.id}</span>
                </div>
                {getAsset(item.asset).video && <span className="afile__badge mono">▶ Motion</span>}
              </div>
              <div className="afile__body">
                <div className="afile__row mono">
                  <span>{item.id}</span>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </div>
                <h3 className="afile__title">{item.title}</h3>
                <div className="afile__row mono afile__row--dim">
                  <span>{item.classification}</span>
                  <span>{item.rev}</span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="modal-title"
        onClose={() => {
          document.body.classList.remove("no-scroll");
          setOpenIdx(null);
          returnFocus.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        {current && (
          <div className="modal__panel" key={current.id}>
            <div className="modal__bar mono">
              <span>PRISMAL // Production archive // {current.id}</span>
              <span className="modal__nav">
                <button type="button" onClick={() => step(-1)} aria-label="Previous file">
                  ←
                </button>
                <span>
                  {String((openIdx ?? 0) + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </span>
                <button type="button" onClick={() => step(1)} aria-label="Next file">
                  →
                </button>
                <button type="button" className="modal__close" onClick={close} aria-label="Close file">
                  ✕
                </button>
              </span>
            </div>
            <div className="modal__content">
              <div className={`modal__media ${current.restricted ? "is-restricted" : ""}`}>
                {getAsset(current.asset).video ? (
                  <video className="modal__video" controls autoPlay muted loop playsInline poster={getAsset(current.asset).src}>
                    <source src={getAsset(current.asset).video} type="video/mp4" />
                  </video>
                ) : (
                  <Art asset={current.asset} code={current.id} sizes="(max-width: 900px) 100vw, 60vw" reveal={false} />
                )}
              </div>
              <div className="modal__info">
                <p className="mono modal__class">{current.classification}</p>
                <h3 id="modal-title" className="modal__title">
                  {current.title}
                </h3>
                <dl className="modal__meta">
                  <div>
                    <dt className="mono">Revision</dt>
                    <dd className="mono">{current.rev}</dd>
                  </div>
                  <div>
                    <dt className="mono">Status</dt>
                    <dd>
                      <span className={statusClass(current.status)}>{current.status}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="mono">Category</dt>
                    <dd className="mono">{current.category}</dd>
                  </div>
                  <div>
                    <dt className="mono">Access</dt>
                    <dd className="mono">{current.restricted ? "Level 03+" : "Public // Level 01"}</dd>
                  </div>
                </dl>
                <p className="modal__desc">{current.description}</p>
                <div className="modal__notes">
                  <p className="mono">Production notes</p>
                  <ul>
                    {current.notes.map((n) => (
                      <li key={n}>{current.restricted ? <span className="redact">{n}</span> : n}</li>
                    ))}
                  </ul>
                </div>
                <p className="modal__disclaimer mono">Development material. Subject to change during production.</p>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
