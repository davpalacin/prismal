# PRISMAL

**A world built to survive.**
Public production portal for PRISMAL, an original science-fiction transmedia universe currently in development.

The site is designed as an internal production environment that has been partially opened to the public. It combines cinematic concept art with structured production metadata, and it keeps restricted material restricted.

---

## Stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- Plain CSS with design tokens (`styles/`). No CSS framework.
- Self-hosted fonts via `@fontsource`: **Inter Tight** (editorial grotesk) and **IBM Plex Mono** (metadata)
- No animation library. Restrained motion is handled by `components/ui/MotionController.tsx` using IntersectionObserver and rAF parallax, and it respects `prefers-reduced-motion`.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npm run lint       # TypeScript type-check
```

Requires Node 20+.

## Project structure

```
app/
  layout.tsx            fonts, metadata, global styles
  page.tsx              section order
  api/access/route.ts   "Request development access" endpoint
components/
  sections/             one component per page section (Hero … Footer)
  ui/                   Nav, Art, Placeholder, ArchiveBrowser (grid + modal),
                        FollowForm, MotionController, Wordmark, Meta
content/
  site.ts               ALL copy, characters, archive files, roadmap phases
  assets.ts             registry of every image / video slot
styles/
  base.css              tokens, reset, buttons, grain, reveal motion
  ui.css                nav, art treatments, placeholders, archive, modal, form
  sections.css          section layouts + responsive rules
public/
  assets/               web-optimised artwork (generated)
  media/                video
scripts/
  optimize-assets.mjs   regenerates /public/assets from source artwork
legacy/                 original single-file page + full-resolution source art
```

## Replacing placeholders with official artwork

Every visual slot is declared once in **`content/assets.ts`**. An entry without `src` renders a labelled production placeholder, for example `[ DEFENDER BULWARK MECH ]`, with a note that says to replace it with official PRISMAL artwork.

To insert real art:

1. Put the source file in `legacy/` (or anywhere) and add a job to `scripts/optimize-assets.mjs`, then run `npm run assets`. You can also drop a ready-made `.webp`/`.jpg` straight into `public/assets/`.
2. In `content/assets.ts`, set `src` (and optionally `srcSet`) on the matching entry.
3. Choose a `treatment`:
   - `negative`: inverts light pencil or ink drawings into a luminous plate (used for the Capital)
   - `paper`: keeps the drawing on paper, framed as a physical archive document
   - `none`: shows final colour artwork untouched
4. Optionally set `focus` (a CSS `object-position`) to control cropping.

Slots currently awaiting art: Exterior environment, Prismal specimen, Defender key art, Bulwark mech, Ferrosoma Combat class, Joseph, Christal (archival photograph), Elizabeth, McAllister, Southern District, Prismal shield study, energy-loop diagram, and the narrative document.

Artwork already in use: the Capital overview, Ferrosoma Scout (rendered study and field sketch), the Ferrosoma motion study, and the Chris Holloway portrait.

## Editing content

All text lives in **`content/site.ts`**: hero, project statement, world cards, Defender roles, energy systems, Ferrosoma specimens, story, characters, the production archive files, transmedia modules, roadmap phases, manifesto, follow and partnership copy, and the footer. Components only handle layout.

Archive files (`archive` array) support `status`: `Approved | WIP | In review | Restricted | Exploration`. Setting `restricted: true` redacts the file's notes in the modal.

## Development access form

`POST /api/access` validates the email and returns a reference code. To forward sign-ups to a mailing list or CRM, set:

```
PRISMAL_ACCESS_WEBHOOK=https://your-provider.example/webhook
```

The endpoint then POSTs `{ email, source, at }` to that URL.

## Before launch

- Replace `CONTACT_EMAIL` in `content/site.ts` (it currently uses a reserved `.example` domain).
- Set `NEXT_PUBLIC_SITE_URL` so Open Graph images resolve to the production domain.
- Replace the placeholder wordmark (`components/ui/Wordmark.tsx`) and `public/favicon.svg` with the official logo.

## Story rules (for contributors)

The public site deliberately does **not** explain: the origin of Prismal, the origin of the Ferrosomas, what happened to Christal, the government conspiracy, McAllister's real role, the experimental Prismal mech, or future revelations involving Chris. Keep new copy on the same side of that line.

---

All visual material represents development work and may change during production. © PRISMAL PROJECT
