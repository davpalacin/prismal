import { roadmap } from "@/content/site";
import { SectionHead } from "../ui/Meta";

export function Roadmap() {
  return (
    <section className="section roadmap" id="development" aria-labelledby="roadmap-title">
      <div className="container">
        <SectionHead index="11" code="DEV / Phase tracker" title={roadmap.heading} id="roadmap-title" />
        <ol className="phases" data-reveal="up">
          {roadmap.phases.map((p, i) => (
            <li key={p.n} className={`phase phase--${p.state}`} style={{ ["--i" as string]: i }}>
              <span className="phase__node" aria-hidden="true" />
              <span className="phase__n mono">Phase {p.n}</span>
              <h3 className="phase__name">{p.name}</h3>
              <span className="phase__status mono">
                {p.state === "active" && <span className="pulse" aria-hidden="true" />}
                {p.status}
              </span>
            </li>
          ))}
        </ol>
        <p className="roadmap__note" data-reveal="up">
          {roadmap.note}
        </p>
      </div>
    </section>
  );
}
