import { footer } from "@/content/site";
import { Wordmark } from "../ui/Wordmark";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Wordmark className="footer__mark" />
          {footer.lines.map((l) => (
            <p key={l} className="footer__line">
              {l}
            </p>
          ))}
        </div>
        <nav aria-label="Footer">
          <ul className="footer__links">
            {footer.links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="mono">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container footer__base mono">
        <span>© PRISMAL PROJECT</span>
        <span>{footer.disclaimer}</span>
        <span>PRJ-PRSM-001 · Rev. 0.8</span>
      </div>
    </footer>
  );
}
