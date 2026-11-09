/**
 * Experience and education cards (SPEC §5.5): role, place, dates, 2 outcome bullets each.
 * TODO(mohamed): replace every entry with your real experience and education.
 */

export type ExperienceEntry = {
  kind: "work" | "education";
  role: string;
  place: string;
  /** Free text so ranges like "2024 — Present" read naturally. */
  dates: string;
  bullets: [string, string];
};

export const experience: ExperienceEntry[] = [
  {
    kind: "work",
    role: "Junior AI Engineer",
    place: "Company name",
    dates: "2026 — Present",
    bullets: [
      "Built a retrieval pipeline that answers internal questions from company documents.",
      "Cut response latency by serving a quantized model on a single GPU.",
    ],
  },
  {
    kind: "work",
    role: "Embedded Systems Intern",
    place: "Company name",
    dates: "2025",
    bullets: [
      "Wrote FreeRTOS firmware for a sensor board shipped in a pilot run.",
      "Added CAN diagnostics that shortened bench testing.",
    ],
  },
  {
    kind: "education",
    role: "B.Sc. Electronics & Communications Engineering",
    place: "University name",
    dates: "2020 — 2025",
    bullets: [
      "Graduation project: an IoT system with on-device ML.",
      "Focus on embedded systems and signal processing.",
    ],
  },
];
