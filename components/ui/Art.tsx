import { getAsset, type AssetKey } from "@/content/assets";
import { Placeholder } from "./Placeholder";

interface ArtProps {
  asset: AssetKey;
  className?: string;
  code?: string;
  sizes?: string;
  priority?: boolean;
  /** Adds scroll parallax to the inner image (handled by MotionController). */
  parallax?: number;
  /** Reveal the frame with a wipe when it enters the viewport. */
  reveal?: boolean;
}

/** Renders an artwork slot: the real asset when available, a labelled placeholder otherwise. */
export function Art({ asset: key, className = "", code, sizes = "100vw", priority, parallax, reveal = true }: ArtProps) {
  const a = getAsset(key);
  const treatment = a.src ? a.treatment ?? "none" : "placeholder";
  return (
    <figure className={`art art--${treatment} ${className}`} data-reveal={reveal ? "wipe" : undefined}>
      <div className="art__inner" data-parallax={parallax}>
        {a.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.src}
            srcSet={a.srcSet}
            sizes={sizes}
            alt={a.alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            style={a.focus ? { objectPosition: a.focus } : undefined}
          />
        ) : (
          <Placeholder label={a.label} kind={a.kind} code={code} />
        )}
      </div>
      {a.src && (
        <figcaption className="art__tag mono" aria-hidden="true">
          {a.label.replace(/[[\]]/g, "").trim()} · Development art
        </figcaption>
      )}
    </figure>
  );
}
