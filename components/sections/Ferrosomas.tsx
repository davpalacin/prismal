import { ferrosomas } from "@/content/site";
import { getAsset } from "@/content/assets";
import { Art } from "../ui/Art";
import { AutoVideo } from "../ui/AutoVideo";
import { SectionHead } from "../ui/Meta";

export function Ferrosomas() {
  const motion = getAsset("ferrosomaMotion");
  return (
    <section className="section ferro" id="ferrosomas" aria-labelledby="ferro-title">
      <div className="container ferro__top">
        <div>
          <SectionHead index="06" code={ferrosomas.code} title={ferrosomas.heading} id="ferro-title" />
          <div className="ferro__body" data-reveal="up">
            {ferrosomas.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <figure className="ferro__feed" data-reveal="wipe">
          <AutoVideo src={motion.video!} poster={motion.src} label="Ferrosoma motion study, looping animation test" />
          <figcaption className="ferro__feedbar mono">
            <span>
              <span className="rec" aria-hidden="true" /> Motion study // FRS-SC-07
            </span>
            <span>Animation test · Not final</span>
          </figcaption>
        </figure>
      </div>

      <div className="container">
        <ul className="specimens">
          {ferrosomas.cards.map((c, i) => (
            <li key={c.code} className={`specimen ${c.locked ? "specimen--locked" : ""}`} data-reveal="up" style={{ ["--i" as string]: i }}>
              <div className="specimen__media">
                {c.asset ? (
                  <Art asset={c.asset} code={c.code} sizes="(max-width: 900px) 100vw, 33vw" reveal={false} />
                ) : (
                  <div className="specimen__void mono" aria-label="Access denied">
                    <span>Access denied</span>
                    <span>Specimen record sealed</span>
                  </div>
                )}
              </div>
              <div className="specimen__body">
                <div className="specimen__head mono">
                  <span>{c.code}</span>
                  <span className="threat" role="img" aria-label={`Threat index ${c.threat} of 5`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <i key={j} className={j < c.threat ? "on" : ""} />
                    ))}
                  </span>
                </div>
                <h3 className="specimen__cls">{c.cls}</h3>
                <p className="specimen__lead">{c.lead}</p>
                <ul className="specimen__traits">
                  {c.traits.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <p className="footnote mono footnote--warn">
          <span aria-hidden="true">▲ </span>
          {ferrosomas.footnote}
        </p>
      </div>
    </section>
  );
}
