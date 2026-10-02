import { ArchiveBrowser } from "../ui/ArchiveBrowser";
import { SectionHead } from "../ui/Meta";

export function Archive() {
  return (
    <section className="section archive-sec" id="archive" aria-labelledby="archive-title">
      <div className="container">
        <div className="archive-sec__head">
          <SectionHead index="09" code="ARC / Production repository" title="Production Archive" id="archive-title">
            <p className="archive-sec__sub">Selected material from the ongoing development of PRISMAL.</p>
          </SectionHead>
          <dl className="archive-sec__sys mono" data-reveal="up" aria-label="Archive session">
            <div>
              <dt>Session</dt>
              <dd>Guest // Level 01</dd>
            </div>
            <div>
              <dt>Index</dt>
              <dd>Partial</dd>
            </div>
            <div>
              <dt>Sync</dt>
              <dd>
                <span className="pulse" aria-hidden="true" /> Live
              </dd>
            </div>
          </dl>
        </div>
        <ArchiveBrowser />
      </div>
    </section>
  );
}
