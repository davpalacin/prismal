import { hero } from "@/content/site";
import { Art } from "../ui/Art";
import { Meta } from "../ui/Meta";

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__bg">
        <Art asset="hero" priority parallax={0.12} reveal={false} className="hero__art" />
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__dome" aria-hidden="true" />
      </div>

      <div className="hero__hud mono" aria-hidden="true">
        <span>PRJ-PRSM-001</span>
        <span>World development</span>
        <span>Rev. 0.8</span>
        <span className="hero__coords">Grid S-04 · 27.114 / 88.402</span>
      </div>

      <div className="hero__content container">
        <p className="hero__labels mono">
          {hero.labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </p>
        <h1 id="hero-title" className="hero__title">
          {hero.title}
        </h1>
        <p className="hero__tagline">{hero.tagline}</p>
        <div className="hero__support">
          {hero.support.map((s) => (
            <p key={s}>{s}</p>
          ))}
          <p className="hero__note">{hero.note}</p>
        </div>
        <div className="hero__ctas">
          <a href="#project" className="btn btn--primary">
            Explore the project
          </a>
          <a href="#archive" className="btn btn--ghost">
            Enter the archive
          </a>
        </div>
        <dl className="hero__meta">
          {hero.meta.map((m) => (
            <Meta key={m.k} k={m.k} v={m.v} live={m.live} />
          ))}
        </dl>
      </div>

      <a href="#project" className="hero__scroll mono" aria-label="Scroll to project">
        <span>Scroll</span>
        <span className="hero__scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
