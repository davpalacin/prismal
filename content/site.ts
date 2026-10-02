import type { AssetKey } from "./assets";

/**
 * PRISMAL — public site copy and structured content.
 * Edit text here; components only handle layout.
 */

/** Replace with the real production inbox before launch. */
export const CONTACT_EMAIL = "production@prismal.example";

export const nav = [
  { label: "Project", href: "#project" },
  { label: "World", href: "#world" },
  { label: "Archive", href: "#archive" },
  { label: "Systems", href: "#systems" },
  { label: "Development", href: "#development" },
] as const;

export const hero = {
  labels: ["Internal development project", "Public access // Level 01"],
  title: "PRISMAL",
  tagline: "A world built to survive.",
  support: ["Humanity survived the end of the world.", "What came after may be worse."],
  note: "An original science-fiction universe currently in development.",
  meta: [
    { k: "Status", v: "Active development", live: true },
    { k: "Format", v: "Transmedia IP" },
    { k: "Genre", v: "Science fiction / Military / Mystery" },
  ],
};

export const statement = {
  code: "Project / 001",
  lead: "PRISMAL is being designed as a universe before it becomes a product.",
  body: [
    "Every location, machine, creature, political structure and character is developed as part of the same narrative system.",
    "The objective is not to build a single story.",
    "It is to build a world capable of generating many of them.",
  ],
  small:
    "The project currently combines narrative development, visual design, character development, mechanical systems, creature design and interactive concepts into a unified production framework.",
  status: [
    { k: "World", v: "In development", progress: 0.72 },
    { k: "Story", v: "In development", progress: 0.58 },
    { k: "Visual identity", v: "In development", progress: 0.44 },
    { k: "Game systems", v: "Prototyping", progress: 0.26 },
  ],
};

export const world = {
  heading: "The World",
  sub: ["Civilization did not recover.", "It reorganized."],
  body: [
    "Decades after a global catastrophe, humanity survives inside isolated fortified cities protected by enormous energy domes.",
    "Beyond them lies a devastated world inhabited by hostile biomechanical organisms known as Ferrosomas.",
    "Inside the walls, civilization continues.",
  ],
  beats: ["People work.", "Families grow.", "Governments function.", "Trains still depart."],
  closing: "But survival has created its own systems of control.",
  cards: [
    {
      n: "01",
      title: "The Capital",
      code: "LOC-CAP-000",
      asset: "worldCapital" as AssetKey,
      copy: [
        "A surviving metropolis protected beneath a massive energy dome.",
        "Order, agriculture, industry and military power coexist inside a civilization built around permanent survival.",
      ],
      meta: "Population: Classified",
    },
    {
      n: "02",
      title: "The Exterior",
      code: "LOC-EXT-###",
      asset: "worldExterior" as AssetKey,
      copy: [
        "Beyond the dome lies a fractured ecosystem shaped by war, abandoned infrastructure and hostile life.",
        "Human presence outside the Capital is temporary by necessity.",
      ],
      meta: "Survey: Archive incomplete",
    },
    {
      n: "03",
      title: "Prismal",
      code: "MAT-PRS-001",
      asset: "worldPrismal" as AssetKey,
      copy: [
        "A rare material at the center of the Capital's technological survival.",
        "Its full nature remains under investigation.",
      ],
      meta: "Origin: Data unavailable",
    },
  ],
};

export const defenders = {
  code: "DFN / Program overview",
  heading: "Defender Program",
  lead: "When conventional weapons are not enough, humanity deploys machines.",
  body: [
    "Defenders operate combat mechs engineered for different battlefield roles.",
    "Their machines combine mechanical armor, advanced energy systems and technologies developed from Prismal research.",
    "Their pilots are soldiers, specialists and symbols of survival.",
  ],
  roles: [
    { code: "DFN-A", name: "Assault", copy: "Fast offensive combat and high-impact engagements.", profile: [0.9, 0.45, 0.4] },
    { code: "DFN-B", name: "Bulwark", copy: "Heavy defense, protection and battlefield control.", profile: [0.3, 0.95, 0.35] },
    { code: "DFN-S", name: "Support", copy: "Tactical assistance, systems control and team sustainability.", profile: [0.55, 0.55, 0.6] },
    { code: "DFN-R", name: "Ranged", copy: "Precision engagement and sustained damage from distance.", profile: [0.5, 0.35, 0.95] },
  ],
  axes: ["Mobility", "Armor", "Reach"],
  note: "Operational classifications shown are preliminary development terminology.",
};

export const energy = {
  code: "ENG-DOC / MCH-ARCH-04",
  heading: "Mech Energy Architecture",
  intro: "PRISMAL mechs are designed around resource management rather than unlimited power.",
  systems: [
    {
      id: "SYS-01",
      name: "Primary Power",
      copy: [
        "The machine's global energy reserve.",
        "It powers the mech's core systems and provides extreme resistance against incoming damage.",
        "Its operational duration varies dramatically depending on model and workload.",
      ],
      readout: { label: "Reserve", value: 0.82 },
    },
    {
      id: "SYS-02",
      name: "Kinetic / Combat Resource",
      copy: [
        "Mechs carry consumable raw material used to support high-demand physical actions and replenish portions of their primary power reserve.",
        "Running, jumping, impact maneuvers and extreme mechanical effort consume this resource dynamically.",
      ],
      readout: { label: "Load", value: 0.54 },
    },
    {
      id: "SYS-03",
      name: "Prismal Shield",
      copy: [
        "Certain configurations can combine Prismal material and stored resources to generate temporary energy shielding.",
      ],
      readout: { label: "Charge", value: 0.31 },
    },
  ],
  experimental: {
    tag: "Experimental system",
    name: "Pure Prismal Core",
    status: "Prototype",
    description: "Restricted",
  },
};

export const ferrosomas = {
  heading: "Hostile Bio-Mechanical Life",
  code: "Ferrosoma / Archive classification",
  body: [
    "Ferrosomas are among the most dangerous organisms encountered beyond the Capital.",
    "They display biological behavior despite bodies composed of structures that resemble engineered mechanical systems.",
    "Their origin, organization and purpose remain uncertain.",
  ],
  cards: [
    {
      cls: "Scout Class",
      code: "FRS-SC-07",
      asset: "ferrosomaScout" as AssetKey,
      lead: "Fast reconnaissance organism.",
      traits: ["Low profile.", "Extreme mobility.", "Long-range sensory structures.", "Frequently observed ahead of larger groups."],
      threat: 2,
    },
    {
      cls: "Combat Class",
      code: "FRS-CB-03",
      asset: "ferrosomaCombat" as AssetKey,
      lead: "Direct engagement organism.",
      traits: ["Heavier structure.", "Aggressive response pattern.", "Designed or evolved for sustained confrontation."],
      threat: 4,
    },
    {
      cls: "Class ████",
      code: "FRS-??-00",
      asset: null,
      lead: "Access denied.",
      traits: ["Observation records sealed.", "Refer to archive supervisor."],
      threat: 5,
      locked: true,
    },
  ],
  footnote: "Archive material / Partially classified",
};

export const story = {
  heading: "Narrative / Chris Holloway",
  lead: ["He spent his life wanting to become a Defender.", "Then his father died trying to keep him away from them."],
  body: [
    "Chris Holloway grew up on a farm near the southern edge of the Capital.",
    "To him, Defenders represented everything beyond the limits of his ordinary life.",
    "His father Joseph saw them differently.",
    "After an attack at the southern gate leaves Joseph dead, Chris discovers that his parents' past was never what he believed.",
    "His father's final words leave him with a question that will pull him directly into the institution Joseph spent years trying to avoid.",
  ],
  quote: "They left your mother to die.",
  status: { k: "Story status", v: "Chapter development active" },
};

export const characters = [
  {
    name: "Chris Holloway",
    file: "CHR-001",
    status: "Protagonist",
    asset: "chris" as AssetKey,
    copy: ["A young man raised far from the military world that defined his parents.", "Driven first by admiration, then by questions."],
  },
  {
    name: "Joseph Holloway",
    file: "CHR-002",
    status: "Former Defender",
    asset: "joseph" as AssetKey,
    copy: ["Chris's father.", "A man whose life changed completely after the death of his wife.", "His silence protected more than grief."],
  },
  {
    name: "Christal Holloway",
    file: "CHR-003",
    status: "Defender / Archival record",
    asset: "christal" as AssetKey,
    copy: [
      "A celebrated Defender whose death became part of the official history of the Capital.",
      "The truth may be considerably more complicated.",
    ],
    flag: "Archive incomplete",
  },
  {
    name: "Elizabeth",
    file: "CHR-004",
    status: "Engineer / Family",
    asset: "elizabeth" as AssetKey,
    copy: [
      "A retired engineer with deep knowledge of Defender technology and a history closely connected to the machines that protect the Capital.",
    ],
  },
  {
    name: "McAllister",
    file: "CHR-005",
    status: "Production / Elite operations",
    asset: "mcallister" as AssetKey,
    copy: [
      "A military-industrial coordinator assigned to elite Defender teams.",
      "Responsible for connecting personnel, technology, private industry and military resources.",
    ],
    flag: "Archive access: Limited",
  },
];

export const archiveCategories = [
  "Character development",
  "Mech design",
  "Creature design",
  "Environment development",
  "Narrative",
  "Technology",
  "Game systems",
] as const;

export type ArchiveCategory = (typeof archiveCategories)[number];

export interface ArchiveItem {
  id: string;
  title: string;
  classification: string;
  category: ArchiveCategory;
  rev: string;
  status: "Approved" | "WIP" | "In review" | "Restricted" | "Exploration";
  asset: AssetKey;
  description: string;
  notes: string[];
  restricted?: boolean;
}

export const archive: ArchiveItem[] = [
  {
    id: "PRSM-CRT-0107",
    title: "Ferrosoma — Scout",
    classification: "Creature development",
    category: "Creature design",
    rev: "Rev. 07",
    status: "In review",
    asset: "ferrosomaScout",
    description:
      "Rendered pencil study of Scout-class Ferrosomas in pursuit. Establishes silhouette, plating language and the long sensory filaments used for tracking.",
    notes: ["Surface corrosion pattern approved for all Scout variants.", "Filament length still under discussion for animation readability."],
  },
  {
    id: "PRSM-MCH-0212",
    title: "Defender Mech — Bulwark",
    classification: "Mechanical design",
    category: "Mech design",
    rev: "Rev. 12",
    status: "WIP",
    asset: "defenderBulwark",
    description:
      "Heavy-defense chassis exploration. Focus on load distribution, frontal armor mass and deployable protection systems.",
    notes: ["Cockpit access revised after pilot ergonomics pass.", "Shield emitter placement pending energy architecture sign-off."],
  },
  {
    id: "PRSM-ENV-0031",
    title: "The Capital — Southern District",
    classification: "Environment development",
    category: "Environment development",
    rev: "WIP",
    status: "WIP",
    asset: "southernDistrict",
    description:
      "Farmland, rail infrastructure and the southern gate. The boundary where ordinary life inside the dome meets the military perimeter.",
    notes: ["Reference: agricultural belt density from Capital overview.", "Gate architecture blocked out; details restricted."],
  },
  {
    id: "PRSM-CHR-0105",
    title: "Chris Holloway",
    classification: "Character development",
    category: "Character development",
    rev: "Rev. 05",
    status: "In review",
    asset: "chris",
    description:
      "Portrait study defining Chris before the events of the story: rural upbringing, restless attention, a look already fixed beyond the window.",
    notes: ["Age read approved.", "Wardrobe progression to be defined per chapter."],
  },
  {
    id: "PRSM-SYS-0000",
    title: "Pure Prismal Core",
    classification: "System development",
    category: "Technology",
    rev: "Rev. ██",
    status: "Restricted",
    asset: "pureCore",
    description: "This file is not available at your current access level.",
    notes: ["Access denied.", "Contact production for clearance."],
    restricted: true,
  },
  {
    id: "PRSM-ENV-0001",
    title: "The Capital — Overview",
    classification: "Environment development",
    category: "Environment development",
    rev: "Rev. 03",
    status: "Approved",
    asset: "worldCapital",
    description:
      "Aerial establishing study. Concentric organisation: central towers, residential rings, agricultural belt and industrial outskirts.",
    notes: ["Dome structure intentionally omitted from this pass.", "Scale reference for all district work."],
  },
  {
    id: "PRSM-CRT-0101",
    title: "Ferrosoma Scout — Field Sketch",
    classification: "Creature development",
    category: "Creature design",
    rev: "Rev. 01",
    status: "Exploration",
    asset: "ferrosomaSketch",
    description: "First notebook sketch of the Scout class. Origin point of the silhouette later refined in Rev. 07.",
    notes: ["Kept for lineage reference."],
  },
  {
    id: "PRSM-CRT-0M02",
    title: "Ferrosoma — Motion Study",
    classification: "Creature development / Motion",
    category: "Creature design",
    rev: "Test 02",
    status: "Exploration",
    asset: "ferrosomaMotion",
    description: "Animation test exploring Scout locomotion and weight. Not representative of final quality.",
    notes: ["Experimental animation pass.", "Gait timing to be revised."],
  },
  {
    id: "PRSM-NAR-0014",
    title: "Chapter Structure — Arc 01",
    classification: "Narrative development",
    category: "Narrative",
    rev: "Rev. 09",
    status: "Restricted",
    asset: "narrativeDoc",
    description: "Chapter breakdown for the opening arc. Public summary only.",
    notes: ["Contents redacted for public access.", "Southern gate sequence locked."],
  },
  {
    id: "PRSM-TEC-0022",
    title: "Prismal Shield — Emission Study",
    classification: "Technology",
    category: "Technology",
    rev: "Rev. 04",
    status: "WIP",
    asset: "shieldStudy",
    description: "Visual language for temporary Prismal shielding: activation, stability and collapse states.",
    notes: ["Amber luminance range defined.", "Collapse state under review."],
  },
  {
    id: "PRSM-GSY-0008",
    title: "Energy Loop — Prototype",
    classification: "Game systems",
    category: "Game systems",
    rev: "Proto 0.3",
    status: "Exploration",
    asset: "energyDiagram",
    description:
      "Paper prototype of the resource loop between primary power, kinetic resource and shield generation.",
    notes: ["Tuning targets defined per Defender role.", "Not representative of final gameplay."],
  },
  {
    id: "PRSM-CRT-0203",
    title: "Ferrosoma — Combat Class",
    classification: "Creature development",
    category: "Creature design",
    rev: "Rev. 03",
    status: "WIP",
    asset: "ferrosomaCombat",
    description: "Heavier engagement organism. Mass, armor overlap and threat display under exploration.",
    notes: ["Silhouette must read clearly against Scout class at distance."],
  },
];

export const transmedia = {
  heading: ["One universe.", "Multiple forms."],
  body: "PRISMAL is being developed as a narrative system capable of expanding across different media without requiring every story to repeat the same events.",
  modules: [
    { code: "TM-01", name: "Graphic Narrative", copy: "The primary visual storytelling format currently in development.", state: "Primary" },
    {
      code: "TM-02",
      name: "Interactive",
      copy: "Gameplay systems designed around mech combat, energy management, survival and specialization.",
      state: "Prototyping",
    },
    { code: "TM-03", name: "Cinematic", copy: "Short-form visual storytelling and experimental cinematic material.", state: "Exploration" },
    {
      code: "TM-04",
      name: "World Expansion",
      copy: "Additional characters, locations and conflicts designed to exist beyond the central narrative.",
      state: "Ongoing",
    },
  ],
  disclaimer: "Formats and production scope remain subject to development.",
};

export type PhaseState = "complete" | "active" | "next" | "future";

export const roadmap = {
  heading: "Development Status",
  phases: [
    { n: "01", name: "World Foundation", status: "Complete / Active revision", state: "complete" as PhaseState },
    { n: "02", name: "Narrative Development", status: "Active", state: "active" as PhaseState },
    { n: "03", name: "Visual Development", status: "Active", state: "active" as PhaseState },
    { n: "04", name: "Prototyping", status: "Active", state: "active" as PhaseState },
    { n: "05", name: "Public Development", status: "Next", state: "next" as PhaseState },
    { n: "06", name: "Production Partnerships", status: "Future", state: "future" as PhaseState },
  ],
  note: "The project is intentionally being developed in public in selected stages while core narrative material remains private.",
};

export const manifesto = {
  lines: ["No product first.", "World first."],
  intro: "PRISMAL is being built from the inside out.",
  pairs: ["Story before spectacle.", "Systems before features.", "Identity before scale."],
  closing: "A universe capable of supporting different stories, different media and different generations of characters.",
};

export const follow = {
  heading: "Follow the Build",
  body: [
    "PRISMAL is currently in active development.",
    "Selected concept art, production material, narrative fragments, prototypes and development updates will be released as the project evolves.",
  ],
  cta: "Request development access",
  links: [
    { label: "Follow development", href: "#follow" },
    { label: "Production updates", href: "#development" },
    { label: "Press / Partnerships", href: "#partnerships" },
  ],
};

export const partnerships = {
  heading: "Production / Partnerships",
  body: "PRISMAL is currently open to conversations with selected artists, developers, production partners, publishers and collaborators interested in long-term worldbuilding and transmedia development.",
  cta: "Contact production",
  meta: [
    { k: "Project", v: "PRISMAL" },
    { k: "Status", v: "In development" },
    { k: "IP", v: "Original" },
  ],
};

export const footer = {
  lines: ["An original science-fiction universe.", "Currently in development."],
  links: [
    { label: "Project", href: "#project" },
    { label: "Archive", href: "#archive" },
    { label: "Development", href: "#development" },
    { label: "Contact", href: "#partnerships" },
  ],
  disclaimer: "All visual material shown represents development work and may change during production.",
};
