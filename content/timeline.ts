/**
 * About timeline: from the first microcontroller to the first LLM project (SPEC §5.2).
 * TODO(mohamed): replace all 5 milestones with your real ones (4–6 total).
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
    year: "2019",
    title: "First microcontroller",
    text: "Blinked an LED on an Arduino Uno and never stopped.",
    side: "hardware",
  },
  {
    year: "2021",
    title: "Firmware on STM32",
    text: "Moved from sketches to bare-metal C, timers and interrupts.",
    side: "hardware",
  },
  {
    year: "2023",
    title: "Connected devices",
    text: "ESP32 nodes talking MQTT to a home dashboard.",
    side: "hardware",
  },
  {
    year: "2024",
    title: "Machine learning",
    text: "First PyTorch models, then deep learning on real data.",
    side: "ai",
  },
  {
    year: "2026",
    title: "First LLM project",
    text: "A local RAG system that writes in my own style.",
    side: "ai",
  },
];
