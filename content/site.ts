/**
 * Personal info — the one file to edit for name, links, hero lines, about text and skills.
 * Everything marked TODO(mohamed) is a placeholder until real content arrives (SPEC §11).
 */

export type SkillGroup = {
  id: "hardware" | "ai" | "tools";
  /** Accent color of the cluster: hardware = cyan, AI = violet, tools = neutral. */
  accent: "cyan" | "violet" | "neutral";
  items: string[];
};

export const site = {
  name: "Mohamed Eissa",
  /** Used in <title> and the footer. */
  shortName: "Mohamed Eissa",
  location: "Cairo, Egypt",
  url: "https://mohamed-eissa.pages.dev",
  roles: ["Junior AI Engineer (Generative AI)", "Embedded & IoT Engineer"],

  /** Typed-and-deleted loop in the hero (animation arrives in Phase 2). */
  heroLines: ["AI Engineer", "Embedded Systems", "IoT Builder", "I build things that think."],

  // TODO(mohamed): replace with your real 3-sentence bio.
  about: [
    "I'm a Cairo-based engineer working where hardware meets intelligence: microcontrollers, sensors and firmware on one side, LLMs and retrieval systems on the other.",
    "I like taking an idea from a breadboard or a notebook all the way to something people can actually use.",
    "Right now I'm focused on Generative AI that runs locally and on connected devices that stay reliable for months.",
  ],

  // TODO(mohamed): real email; GitHub confirmed from the repo owner; LinkedIn and WhatsApp to confirm.
  email: "hello@example.com",
  links: {
    github: "https://github.com/3isa2002",
    linkedin: "",
    /** Full wa.me link, e.g. https://wa.me/20XXXXXXXXXX. Optional. */
    whatsapp: "",
  },

  /** PDFs live in public/cv/. Short share links /cv/ai and /cv/embedded redirect here. */
  cv: {
    ai: "/cv/mohamed-eissa-ai.pdf",
    embedded: "/cv/mohamed-eissa-embedded.pdf",
  },

  // TODO(mohamed): confirm the skill list (SPEC §5.4). Names must match project `stack` values to link up.
  skills: [
    {
      id: "hardware",
      accent: "cyan",
      items: ["C", "C++", "STM32", "ESP32", "Arduino", "FreeRTOS", "CAN", "MQTT", "Sensors"],
    },
    {
      id: "ai",
      accent: "violet",
      items: ["Python", "PyTorch", "LLMs", "RAG", "LangChain", "Ollama", "ChromaDB"],
    },
    {
      id: "tools",
      accent: "neutral",
      items: ["Git", "Docker", "Linux", "Node-RED", "Next.js", "TypeScript"],
    },
  ] satisfies SkillGroup[],
} as const;

export type Site = typeof site;
