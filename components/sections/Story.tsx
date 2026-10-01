import { story } from "@/content/site";
import { Meta, SectionHead } from "../ui/Meta";

export function Story() {
  return (
    <section className="section story" id="story" aria-labelledby="story-title">
      <div className="container">
        <SectionHead index="07" code="NAR / Arc 01 — Public summary" title={story.heading} id="story-title" />
        <div className="story__grid">
          <p className="story__lead" data-reveal="up">
            {story.lead.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
          <div className="story__body" data-reveal="up">
            {story.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="story__quote" data-reveal="quote">
        <blockquote>
          <p>“{story.quote}”</p>
        </blockquote>
        <span className="story__qmeta mono" aria-hidden="true">
          Transcript fragment · Southern gate · Source: ████████
        </span>
      </div>
      <div className="container">
        <dl className="story__status">
          <Meta k={story.status.k} v={story.status.v} live />
        </dl>
      </div>
    </section>
  );
}
