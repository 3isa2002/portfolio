/**
 * About timeline: from networks and microcontrollers to LLMs on real devices (SPEC §5.2).
 * From Mohamed's CVs (2026-11-09).
 */

export type Milestone = {
  year: string;
  title: string;
  text: string;
  /** Which side of the story it belongs to: drives the dot color (cyan → violet). */
  side: "hardware" | "ai";
};

export const timeline: Milestone[] = [
  {
    year: "2020",
    title: "Computer Science at FUE",
    text: "Future University in Egypt, affiliated with the University of Cincinnati.",
    side: "hardware",
  },
  {
    year: "2021",
    title: "First network internship",
    text: "Connectivity and troubleshooting at Misr Phosphate; topologies in Packet Tracer.",
    side: "hardware",
  },
  {
    year: "2024",
    title: "Arabic OCR, graduated",
    text: "Built the OCR module that reads and validates Egyptian ID cards; CCNA: Intro to Networks.",
    side: "ai",
  },
  {
    year: "2025",
    title: "Systems Branch",
    text: "Military service: a digital archive replacing a paper process, and the branch network.",
    side: "hardware",
  },
  {
    year: "2026",
    title: "Wanas & production work",
    text: "An ESP32-S3 voice desk assistant, and a client platform shipped to production.",
    side: "ai",
  },
];
