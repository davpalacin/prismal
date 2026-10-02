import { manifesto } from "@/content/site";

export function Manifesto() {
  return (
    <section className="section manifesto" id="manifesto" aria-labelledby="manifesto-title">
      <div className="container">
        <p className="manifesto__code mono" data-reveal="up">
          12 — Production principle
        </p>
        <h2 id="manifesto-title" className="manifesto__title">
          <span data-reveal="line">{manifesto.lines[0]}</span>
          <span data-reveal="line" className="manifesto__accent">
            {manifesto.lines[1]}
          </span>
        </h2>
        <div className="manifesto__grid">
          <p className="manifesto__intro" data-reveal="up">
            {manifesto.intro}
          </p>
          <ul className="manifesto__pairs" data-reveal="up">
            {manifesto.pairs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="manifesto__closing" data-reveal="up">
            {manifesto.closing}
          </p>
        </div>
      </div>
    </section>
  );
}
