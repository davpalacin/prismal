import { follow } from "@/content/site";
import { FollowForm } from "../ui/FollowForm";

export function Follow() {
  return (
    <section className="section follow" id="follow" aria-labelledby="follow-title">
      <div className="container follow__grid">
        <div data-reveal="up">
          <p className="mono follow__code">13 — Distribution list // Open</p>
          <h2 id="follow-title" className="follow__title">
            {follow.heading}
          </h2>
        </div>
        <div className="follow__main" data-reveal="up">
          {follow.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <FollowForm cta={follow.cta} />
          <ul className="follow__links">
            {follow.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="mono">
                  {l.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
