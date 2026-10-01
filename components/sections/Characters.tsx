import { characters } from "@/content/site";
import { Art } from "../ui/Art";
import { SectionHead } from "../ui/Meta";

export function Characters() {
  return (
    <section className="section chars" id="characters" aria-labelledby="chars-title">
      <div className="container">
        <SectionHead index="08" code="CHR / Selected profiles" title="Characters" id="chars-title">
          <p className="chars__sub mono">05 of ██ profiles cleared for public access</p>
        </SectionHead>
      </div>
      <ul className="chars__rail container-wide">
        {characters.map((c, i) => (
          <li key={c.file} className={`pcard ${i === 0 ? "pcard--lead" : ""}`} data-reveal="up" style={{ ["--i" as string]: i }}>
            <div className="pcard__media">
              <Art asset={c.asset} code={c.file} sizes="(max-width: 700px) 85vw, 30vw" reveal={false} />
              <span className="pcard__file mono">{c.file}</span>
            </div>
            <div className="pcard__body">
              <h3 className="pcard__name">{c.name}</h3>
              <dl className="pcard__status">
                <dt className="mono">Status</dt>
                <dd className="mono">{c.status}</dd>
              </dl>
              <div className="pcard__desc">
                {c.copy.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {c.flag && <p className="pcard__flag mono">{c.flag}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
