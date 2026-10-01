/** PRISMAL wordmark: a prism glyph + tracked logotype. Swap for the official logo when available. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <svg className="wordmark__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 22 20H2Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M12 2v18M12 11l10 9M12 11 2 20" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".55" />
        <circle cx="12" cy="11" r="1.6" className="wordmark__core" />
      </svg>
      <span className="wordmark__text">PRISMAL</span>
    </span>
  );
}
