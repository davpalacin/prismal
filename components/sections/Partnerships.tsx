import { CONTACT_EMAIL, partnerships } from "@/content/site";
import { Meta } from "../ui/Meta";

export function Partnerships() {
  return (
    <section className="section partners" id="partnerships" aria-labelledby="partners-title">
      <div className="container partners__grid" data-reveal="up">
        <p className="mono partners__code">14</p>
        <div>
          <h2 id="partners-title" className="partners__title">
            {partnerships.heading}
          </h2>
          <p className="partners__body">{partnerships.body}</p>
          <a className="btn btn--ghost" href={`mailto:${CONTACT_EMAIL}?subject=PRISMAL%20%E2%80%94%20Production%20inquiry`}>
            {partnerships.cta} <span aria-hidden="true">→</span>
          </a>
        </div>
        <dl className="partners__meta">
          {partnerships.meta.map((m) => (
            <Meta key={m.k} k={`${m.k}:`} v={m.v} />
          ))}
        </dl>
      </div>
    </section>
  );
}
