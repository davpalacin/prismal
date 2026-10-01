import { defenders } from "@/content/site";
import { Art } from "../ui/Art";
import { SectionHead } from "../ui/Meta";

export function Defenders() {
  return (
    <section className="section defenders" id="systems" aria-labelledby="defenders-title">
      <div className="container defenders__top">
        <div>
          <SectionHead index="04" code={defenders.code} title={defenders.heading} id="defenders-title" />
          <p className="defenders__lead" data-reveal="up">
            {defenders.lead}
          </p>
          <div className="defenders__body" data-reveal="up">
            {defenders.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
        <div className="defenders__art">
          <Art asset="defenderKeyArt" code="DFN-KEY-01" parallax={0.05} sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
      </div>

      <div className="container">
        <ul className="roles">
          {defenders.roles.map((r, i) => (
            <li key={r.code} className="role" data-reveal="up" style={{ ["--i" as string]: i }}>
              <div className="role__head mono">
                <span>{r.code}</span>
                <span>Class 0{i + 1}</span>
              </div>
              <h3 className="role__name">{r.name}</h3>
              <p className="role__copy">{r.copy}</p>
              <dl className="role__profile">
                {defenders.axes.map((a, j) => (
                  <div key={a}>
                    <dt className="mono">{a}</dt>
                    <dd>
                      <span className="role__bar" role="img" style={{ ["--v" as string]: r.profile[j] }} aria-label={`${Math.round(r.profile[j] * 100)} of 100`} />
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
        <p className="footnote mono">
          <span aria-hidden="true">※ </span>
          {defenders.note}
        </p>
      </div>
    </section>
  );
}
