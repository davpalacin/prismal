import { world } from "@/content/site";
import { Art } from "../ui/Art";
import { SectionHead } from "../ui/Meta";

export function World() {
  return (
    <section className="section world" id="world" aria-labelledby="world-title">
      <div className="container">
        <div className="world__intro">
          <SectionHead index="03" code="WLD / Setting overview" title={world.heading} id="world-title">
            <p className="world__sub">
              {world.sub.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </p>
          </SectionHead>
          <div className="world__copy" data-reveal="up">
            {world.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ul className="world__beats">
              {world.beats.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="world__closing">{world.closing}</p>
          </div>
        </div>
      </div>

      <div className="world__cards container-wide">
        {world.cards.map((c, i) => (
          <article key={c.n} className={`wcard wcard--${i + 1}`} data-reveal="up" aria-labelledby={`wcard-${c.n}`}>
            <div className="wcard__media">
              <Art asset={c.asset} code={c.code} parallax={i === 0 ? 0.06 : undefined} sizes="(max-width: 900px) 100vw, 60vw" />
            </div>
            <div className="wcard__body">
              <p className="wcard__n mono">
                {c.n} <span>— {c.code}</span>
              </p>
              <h3 id={`wcard-${c.n}`} className="wcard__title">
                {c.title}
              </h3>
              {c.copy.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="wcard__meta mono">{c.meta}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
