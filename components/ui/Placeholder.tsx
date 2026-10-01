import type { PlaceholderKind } from "@/content/assets";

/** Line-art glyphs hinting at the kind of asset expected in each slot. */
function Glyph({ kind }: { kind: PlaceholderKind }) {
  switch (kind) {
    case "environment":
      return (
        <g>
          <path d="M40 150 Q200 20 360 150" />
          <path d="M70 150 Q200 45 330 150" strokeDasharray="3 5" />
          <path d="M150 150V96h14v54M172 150V70h16v80M196 150V58h12v92M216 150V84h14v66M238 150V104h12v46" />
          <path d="M10 150h380" />
          <path d="M10 162h380M30 174h340" strokeDasharray="2 6" />
        </g>
      );
    case "mech":
      return (
        <g>
          <path d="M170 40h60l10 30h-80z" />
          <path d="M150 74h100v56H150z" />
          <path d="M150 84l-34 10v46l20 8M250 84l34 10v46l-20 8" />
          <path d="M168 130l-10 50h26l6-50M232 130l10 50h-26l-6-50" />
          <path d="M188 52h24" />
          <circle cx="200" cy="100" r="9" />
          <path d="M120 186h160" strokeDasharray="3 5" />
        </g>
      );
    case "creature":
      return (
        <g>
          <path d="M70 110l40-26 26 4 60-8 70 10 60 22" />
          <path d="M70 110l18 10 30-6" />
          <path d="M110 84l150-60M122 86l160-54" strokeDasharray="2 5" />
          <path d="M150 104l-16 44 -12 8M180 104l-4 40 10 12M260 100l14 44 -10 12M300 104l22 36" />
          <path d="M40 170h320" strokeDasharray="3 6" />
        </g>
      );
    case "portrait":
      return (
        <g>
          <ellipse cx="200" cy="84" rx="34" ry="42" />
          <path d="M120 190c6-40 40-58 80-58s74 18 80 58" />
          <path d="M150 84h100M200 30v120" strokeDasharray="2 5" />
          <circle cx="200" cy="84" r="60" strokeDasharray="1 6" />
        </g>
      );
    case "document":
      return (
        <g>
          <path d="M130 30h110l30 30v130H130z" />
          <path d="M240 30v30h30" />
          <path d="M150 80h100M150 96h100M150 112h70M150 138h100M150 154h90M150 170h50" />
        </g>
      );
    case "system":
      return (
        <g>
          <circle cx="200" cy="105" r="22" />
          <circle cx="200" cy="105" r="52" strokeDasharray="3 5" />
          <circle cx="200" cy="105" r="84" strokeDasharray="1 7" />
          <path d="M200 20v34M200 156v34M115 105h33M252 105h33" />
          <circle cx="200" cy="53" r="4" />
          <circle cx="252" cy="105" r="4" />
          <circle cx="148" cy="105" r="4" />
        </g>
      );
    case "redacted":
      return (
        <g>
          <path d="M120 60h160v90H120z" />
          <path d="M120 60l160 90M280 60L120 150" strokeDasharray="3 5" />
        </g>
      );
  }
}

export function Placeholder({ label, kind, code }: { label: string; kind: PlaceholderKind; code?: string }) {
  const restricted = kind === "redacted";
  return (
    <div className={`ph ph--${kind}`} role="img" aria-label={`Placeholder: ${label}`}>
      <div className="ph__grid" aria-hidden="true" />
      <svg className="ph__glyph" viewBox="0 0 400 210" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
        <Glyph kind={kind} />
      </svg>
      <span className="ph__corner ph__corner--tl" aria-hidden="true" />
      <span className="ph__corner ph__corner--tr" aria-hidden="true" />
      <span className="ph__corner ph__corner--bl" aria-hidden="true" />
      <span className="ph__corner ph__corner--br" aria-hidden="true" />
      <span className="ph__top mono">{restricted ? "Access denied" : "Asset pending"}{code ? ` // ${code}` : ""}</span>
      <span className="ph__foot">
        <span className="ph__label mono">{label}</span>
        <span className="ph__note mono">{restricted ? "File withheld from public archive" : "Placeholder — replace with official PRISMAL artwork"}</span>
      </span>
    </div>
  );
}
