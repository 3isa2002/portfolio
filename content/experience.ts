/**
 * Experience and education cards (SPEC §5.5): role, place, dates, 2 outcome bullets each.
 * From Mohamed's CVs (2026-11-09).
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
    role: "Freelance Developer",
    place: "Freelance · Cairo",
    dates: "Mar 2026 — Present",
    bullets: [
      "Turn client requirements into working web, mobile and AI-integrated applications, from scoping to delivery.",
      "Delivered the Shadia Travel platform (booking, payments, admin dashboard) to production.",
    ],
  },
  {
    kind: "work",
    role: "IT Support Intern",
    place: "Bayan Tech · Cairo",
    dates: "Apr 2026 — Jun 2026",
    bullets: [
      "Provided hardware, software and end-user support across the office.",
      "Handled day-to-day support requests from staff.",
    ],
  },
  {
    kind: "work",
    role: "IT Help Desk (Military Service)",
    place: "Military Engineers Dept., Systems Branch",
    dates: "Mar 2025 — Mar 2026",
    bullets: [
      "Designed a digital archive and tracking system that replaced a paper-based process for documents and estimations.",
      "Maintained the branch network and resolved connectivity, hardware and software issues.",
    ],
  },
  {
    kind: "work",
    role: "Cyber Security Trainee",
    place: "Ministry of Military Production",
    dates: "Jul 2023 — Aug 2023",
    bullets: [
      "Hands-on vulnerability assessment with Burp Suite and Metasploit.",
      "Practiced applied cryptography fundamentals.",
    ],
  },
  {
    kind: "work",
    role: "Network Support Trainee",
    place: "Misr Phosphate Company",
    dates: "Aug 2021 — Sep 2021",
    bullets: [
      "Supported network connectivity and troubleshooting.",
      "Simulated network topologies in Cisco Packet Tracer.",
    ],
  },
  {
    kind: "education",
    role: "B.Sc. Computer Science",
    place: "Future University in Egypt (with University of Cincinnati)",
    dates: "2020 — 2024",
    bullets: [
      "Graduation project: the Arabic OCR and data-extraction module of a multi-modal authentication system.",
      "Head of PR at Google Developer Student Clubs; ran C++ peer-learning sessions for junior students.",
    ],
  },
];
