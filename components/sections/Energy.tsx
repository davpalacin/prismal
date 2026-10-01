import { energy } from "@/content/site";
import { SectionHead } from "../ui/Meta";

function Diagram() {
  return (
    <svg className="diagram" viewBox="0 0 720 260" role="img" aria-labelledby="diagram-title">
      <title id="diagram-title">Energy flow: kinetic resource replenishes primary power; primary power and Prismal material feed the shield.</title>
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0v6" stroke="currentColor" strokeWidth="1" opacity=".25" />
        </pattern>
      </defs>
      <g className="diagram__grid">
        {Array.from({ length: 13 }).map((_, i) => (
          <path key={`v${i}`} d={`M${i * 60} 0v260`} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 65}h720`} />
        ))}
      </g>
      {/* nodes */}
      <g className="diagram__node">
        <rect x="30" y="90" width="170" height="80" />
        <text x="44" y="116">SYS-02</text>
        <text x="44" y="140" className="diagram__big">KINETIC RES.</text>
        <text x="44" y="158">CONSUMABLE</text>
      </g>
      <g className="diagram__node diagram__node--core">
        <circle cx="360" cy="130" r="64" />
        <circle cx="360" cy="130" r="48" strokeDasharray="2 5" />
        <text x="360" y="124" textAnchor="middle">SYS-01</text>
        <text x="360" y="144" textAnchor="middle" className="diagram__big">PRIMARY</text>
      </g>
      <g className="diagram__node diagram__node--shield">
        <rect x="520" y="40" width="170" height="80" />
        <text x="534" y="66">SYS-03</text>
        <text x="534" y="90" className="diagram__big">PRISMAL SHIELD</text>
        <text x="534" y="108">TEMPORARY</text>
      </g>
      <g className="diagram__node diagram__node--locked">
        <rect x="520" y="150" width="170" height="80" fill="url(#hatch)" />
        <text x="534" y="176">EXP-00</text>
        <text x="534" y="200" className="diagram__big">██████ CORE</text>
        <text x="534" y="218">RESTRICTED</text>
      </g>
      {/* flows */}
      <path className="diagram__flow" d="M200 130H296" />
      <path className="diagram__flow" d="M418 102C470 80 480 80 520 80" />
      <path className="diagram__flow diagram__flow--dim" d="M418 158C470 180 480 190 520 190" />
      <text x="212" y="120" className="diagram__lbl">REPLENISH</text>
      <text x="424" y="66" className="diagram__lbl">+ PRISMAL</text>
      <text x="424" y="206" className="diagram__lbl">NO DATA</text>
    </svg>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  const segs = 24;
  const on = Math.round(value * segs);
  return (
    <div className="gauge" aria-hidden="true">
      <div className="gauge__segs">
        {Array.from({ length: segs }).map((_, i) => (
          <span key={i} className={i < on ? "on" : ""} style={{ ["--i" as string]: i }} />
        ))}
      </div>
      <div className="gauge__lbl mono">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
}

export function Energy() {
  return (
    <section className="section energy" id="energy" aria-labelledby="energy-title">
      <div className="container">
        <div className="energy__head">
          <SectionHead index="05" code={energy.code} title={energy.heading} id="energy-title" />
          <p className="energy__intro" data-reveal="up">
            {energy.intro}
          </p>
        </div>

        <div className="energy__sheet" data-reveal="up">
          <div className="sheet__bar mono">
            <span>Fig. 01 — Resource flow (simplified)</span>
            <span>Scale: N/A · Sheet 1 of 4</span>
          </div>
          <Diagram />
        </div>

        <div className="energy__grid">
          {energy.systems.map((s, i) => (
            <article key={s.id} className="hud" data-reveal="up" style={{ ["--i" as string]: i }} aria-labelledby={`sys-${s.id}`}>
              <div className="hud__head mono">
                <span>{s.id}</span>
                <span className="hud__ok">
                  <span className="pulse" aria-hidden="true" /> Nominal
                </span>
              </div>
              <h3 id={`sys-${s.id}`} className="hud__title">
                {s.name}
              </h3>
              {s.copy.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <Gauge value={s.readout.value} label={s.readout.label} />
            </article>
          ))}

          <article className="hud hud--classified" data-reveal="up" aria-labelledby="sys-exp">
            <div className="hud__head mono">
              <span>EXP-00</span>
              <span className="hud__warn">▲ Classified</span>
            </div>
            <p className="mono hud__tag">{energy.experimental.tag}</p>
            <h3 id="sys-exp" className="hud__title">
              {energy.experimental.name}
            </h3>
            <dl className="hud__dl">
              <div>
                <dt className="mono">Status:</dt>
                <dd className="mono hud__proto">{energy.experimental.status}</dd>
              </div>
              <div>
                <dt className="mono">Description:</dt>
                <dd className="mono">
                  <span className="redact" aria-hidden="true">
                    ████████ ███████ ██████████ ██ █████
                  </span>
                  <span className="hud__restricted">{energy.experimental.description}</span>
                </dd>
              </div>
            </dl>
            <p className="mono hud__foot">Clearance required · Level 03+</p>
          </article>
        </div>
      </div>
    </section>
  );
}
