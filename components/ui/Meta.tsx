import type { ReactNode } from "react";

/** Key / value metadata pair in the production-document style. */
export function Meta({ k, v, live, className = "" }: { k: ReactNode; v: ReactNode; live?: boolean; className?: string }) {
  return (
    <div className={`meta ${className}`}>
      <dt className="meta__k mono">{k}</dt>
      <dd className="meta__v mono">
        {live && <span className="pulse" aria-hidden="true" />}
        {v}
      </dd>
    </div>
  );
}

export function SectionHead({
  index,
  code,
  title,
  children,
  id,
}: {
  index: string;
  code?: string;
  title: ReactNode;
  children?: ReactNode;
  id?: string;
}) {
  return (
    <header className="shead" data-reveal="up">
      <div className="shead__rail mono" aria-hidden="true">
        <span>{index}</span>
        <span className="shead__line" />
        {code && <span>{code}</span>}
      </div>
      <h2 className="shead__title" id={id}>
        {title}
      </h2>
      {children}
    </header>
  );
}
