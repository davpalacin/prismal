import { statement } from "@/content/site";

export function Statement() {
  return (
    <section className="section statement" id="project" aria-labelledby="statement-title">
      <div className="container statement__grid">
        <aside className="statement__aside mono" data-reveal="up">
          <p className="statement__code">{statement.code}</p>
          <p>Narrative development</p>
          <p>Internal / Public access</p>
          <p className="statement__rev">Doc. PRSM-BIB-00 · Rev. 0.8</p>
        </aside>
        <div className="statement__main">
          <h2 id="statement-title" className="statement__lead" data-reveal="up">
            {statement.lead}
          </h2>
          <div className="statement__body" data-reveal="up">
            {statement.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="statement__small" data-reveal="up">
            {statement.small}
          </p>
        </div>
      </div>

      <div className="container">
        <ol className="statusbar" data-reveal="up" aria-label="Development status by area">
          {statement.status.map((s, i) => (
            <li key={s.k} className="statusbar__item" style={{ ["--p" as string]: s.progress, ["--i" as string]: i }}>
              <span className="statusbar__k mono">
                <span aria-hidden="true">0{i + 1} / </span>
                {s.k}
              </span>
              <span className="statusbar__v mono">
                <span className="pulse" aria-hidden="true" />
                {s.v}
              </span>
              <span className="statusbar__track" aria-hidden="true">
                <span className="statusbar__fill" />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
