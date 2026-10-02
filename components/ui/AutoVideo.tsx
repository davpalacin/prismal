/** Muted looping video that only plays while visible (see MotionController). */
export function AutoVideo({ src, poster, label }: { src: string; poster?: string; label: string }) {
  return (
    <video className="autovideo" data-autoplay muted loop playsInline preload="none" poster={poster} aria-label={label}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
