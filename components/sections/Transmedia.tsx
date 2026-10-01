import { transmedia } from "@/content/site";
import { SectionHead } from "../ui/Meta";

export function Transmedia() {
  return (
    <section className="section trans" id="transmedia" aria-labelledby="trans-title">
      <div className="container trans__grid">
        <div>
          <SectionHead
            index="10"
            code="TRM / Format map"
            id="trans-title"
            title={
              <>
                {transmedia.heading[0]}
                <br />
                {transmedia.heading[1]}
              </>
            }
          />
          <p className="trans__body" data-reveal="up">
            {transmedia.body}
          </p>
        </div>
        <div className="trans__map" aria-hidden="true" data-reveal="up">
          <svg viewBox="-44 -6 388 312">
            <circle cx="150" cy="150" r="26" className="trans__core" />
            <circle cx="150" cy="150" r="70" />
            <circle cx="150" cy="150" r="120" strokeDasharray="2 6" />
            {[0, 90, 180, 270].map((deg, i) => {
              const r = (deg * Math.PI) / 180;
              const x = 150 + Math.cos(r) * 120;
              const y = 150 + Math.sin(r) * 120;
              return (
                <g key={deg}>
                  <path d={`M${150 + Math.cos(r) * 26} ${150 + Math.sin(r) * 26}L${x} ${y}`} className="trans__spoke" />
                  <rect x={x - 5} y={y - 5} width="10" height="10" />
                  <text
                    x={i === 0 ? x + 12 : i === 2 ? x - 12 : x}
                    y={i === 1 ? y + 22 : i === 3 ? y - 14 : y + 3}
                    textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
                  >
                    TM-0{i + 1}
                  </text>
                </g>
              );
            })}
            <text x="150" y="154" textAnchor="middle" className="trans__coretext">
              WORLD
            </text>
          </svg>
        </div>
      </div>
      <div className="container">
        <ul className="modules">
          {transmedia.modules.map((m, i) => (
            <li key={m.code} className="module" data-reveal="up" style={{ ["--i" as string]: i }}>
              <div className="module__head mono">
                <span>{m.code}</span>
                <span>{m.state}</span>
              </div>
              <h3 className="module__name">{m.name}</h3>
              <p>{m.copy}</p>
            </li>
          ))}
        </ul>
        <p className="footnote mono">
          <span aria-hidden="true">※ </span>
          {transmedia.disclaimer}
        </p>
      </div>
    </section>
  );
}
