/**
 * PRISMAL — visual asset registry.
 *
 * Every image/video slot on the site is declared here. To replace a
 * placeholder with official PRISMAL artwork:
 *   1. drop the file in /public/assets (or /public/media for video)
 *   2. set `src` (and optionally `srcSet`) on the matching entry below
 * Entries without `src` render a labelled production placeholder.
 *
 * `treatment` controls how artwork sits on the dark interface:
 *   - "negative": inverts light pencil/ink artwork into a luminous plate
 *   - "paper":    keeps the original paper tone, framed as a physical document
 *   - "none":     shows the file untouched (use for final colour artwork)
 */

export type Treatment = "negative" | "paper" | "none";
export type PlaceholderKind = "environment" | "mech" | "creature" | "portrait" | "document" | "system" | "redacted";

export interface Asset {
  /** Label shown on the placeholder, and the brief for the final asset. */
  label: string;
  alt: string;
  kind: PlaceholderKind;
  src?: string;
  srcSet?: string;
  video?: string;
  treatment?: Treatment;
  /** CSS object-position for cropping. */
  focus?: string;
}

export const assets = {
  hero: {
    label: "[ HERO — THE CAPITAL / DOME ]",
    alt: "Aerial concept drawing of the Capital: a cluster of towers inside a circular perimeter, surrounded by farmland, housing and industrial districts.",
    kind: "environment",
    src: "/assets/capital-2400.webp",
    srcSet: "/assets/capital-1200.webp 1200w, /assets/capital-2400.webp 2400w",
    treatment: "negative",
    focus: "50% 30%",
  },
  worldCapital: {
    label: "[ THE CAPITAL — DOME ENVIRONMENT ]",
    alt: "Concept drawing of the Capital's central towers rising above surrounding districts.",
    kind: "environment",
    src: "/assets/capital-2400.webp",
    srcSet: "/assets/capital-1200.webp 1200w, /assets/capital-2400.webp 2400w",
    treatment: "negative",
    focus: "50% 22%",
  },
  worldExterior: {
    label: "[ THE EXTERIOR — WASTELAND ENVIRONMENT ]",
    alt: "Placeholder for exterior wasteland environment art.",
    kind: "environment",
  },
  worldPrismal: {
    label: "[ PRISMAL MATERIAL — SPECIMEN STUDY ]",
    alt: "Placeholder for Prismal material specimen art.",
    kind: "system",
  },
  defenderKeyArt: {
    label: "[ DEFENDER MECH — KEY ART ]",
    alt: "Placeholder for Defender mech key art.",
    kind: "mech",
  },
  defenderBulwark: {
    label: "[ DEFENDER BULWARK MECH ]",
    alt: "Placeholder for Bulwark-class Defender mech design sheet.",
    kind: "mech",
  },
  ferrosomaScout: {
    label: "[ FERROSOMA SCOUT ART ]",
    alt: "Pencil concept art of two Scout-class Ferrosomas sprinting across a rocky wasteland, long sensory filaments trailing behind them.",
    kind: "creature",
    src: "/assets/ferrosoma-scout-1200.webp",
    srcSet: "/assets/ferrosoma-scout-800.webp 800w, /assets/ferrosoma-scout-1200.webp 1200w",
    treatment: "paper",
    focus: "50% 55%",
  },
  ferrosomaSketch: {
    label: "[ FERROSOMA SCOUT — FIELD SKETCH ]",
    alt: "Early pencil sketch of the Scout-class Ferrosoma on lined notebook paper.",
    kind: "creature",
    src: "/assets/ferrosoma-scout-sketch-1200.webp",
    srcSet: "/assets/ferrosoma-scout-sketch-800.webp 800w, /assets/ferrosoma-scout-sketch-1200.webp 1200w",
    treatment: "paper",
    focus: "50% 60%",
  },
  ferrosomaCombat: {
    label: "[ FERROSOMA COMBAT CLASS ART ]",
    alt: "Placeholder for Combat-class Ferrosoma art.",
    kind: "creature",
  },
  ferrosomaMotion: {
    label: "[ FERROSOMA MOTION STUDY ]",
    alt: "Animated motion study of a Scout-class Ferrosoma.",
    kind: "creature",
    video: "/media/ferrosomas.mp4",
    src: "/assets/ferrosoma-scout-1200.webp",
    treatment: "none",
  },
  chris: {
    label: "[ CHRIS HOLLOWAY PORTRAIT ]",
    alt: "Pencil portrait of Chris Holloway, a young man with dark tousled hair, looking aside in front of a window.",
    kind: "portrait",
    src: "/assets/chris-holloway-1200.webp",
    srcSet: "/assets/chris-holloway-800.webp 800w, /assets/chris-holloway-1200.webp 1200w",
    treatment: "paper",
    focus: "50% 28%",
  },
  joseph: {
    label: "[ JOSEPH HOLLOWAY PORTRAIT ]",
    alt: "Placeholder for Joseph Holloway portrait.",
    kind: "portrait",
  },
  christal: {
    label: "[ CHRISTAL ARCHIVAL PHOTOGRAPH ]",
    alt: "Placeholder for an archival photograph of Christal Holloway.",
    kind: "portrait",
  },
  elizabeth: {
    label: "[ ELIZABETH PORTRAIT ]",
    alt: "Placeholder for Elizabeth portrait.",
    kind: "portrait",
  },
  mcallister: {
    label: "[ McALLISTER PORTRAIT ]",
    alt: "Placeholder for McAllister portrait.",
    kind: "portrait",
  },
  southernDistrict: {
    label: "[ THE CAPITAL — SOUTHERN DISTRICT ]",
    alt: "Placeholder for Southern District environment development.",
    kind: "environment",
  },
  pureCore: {
    label: "[ PURE PRISMAL CORE — RESTRICTED ]",
    alt: "Restricted file. No image available.",
    kind: "redacted",
  },
  conceptSheet: {
    label: "[ PRODUCTION CONCEPT SHEET ]",
    alt: "Placeholder for a production concept sheet.",
    kind: "document",
  },
  energyDiagram: {
    label: "[ ENERGY LOOP — SYSTEM DIAGRAM ]",
    alt: "Placeholder for game systems diagram.",
    kind: "system",
  },
  shieldStudy: {
    label: "[ PRISMAL SHIELD — VFX STUDY ]",
    alt: "Placeholder for Prismal shield visual effects study.",
    kind: "system",
  },
  narrativeDoc: {
    label: "[ NARRATIVE — CHAPTER STRUCTURE ]",
    alt: "Placeholder for narrative development document.",
    kind: "document",
  },
} satisfies Record<string, Asset>;

export type AssetKey = keyof typeof assets;

export function getAsset(key: AssetKey): Asset {
  return assets[key];
}
