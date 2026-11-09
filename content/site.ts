/**
 * Personal info — the one file to edit for name, links, hero lines, about text and skills.
 * From Mohamed's CVs (2026-11-09). The phone number is deliberately not on the site; it is in
 * the CV PDFs only.
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
  roles: ["AI Engineer — Generative AI & LLMs", "Embedded & IoT"],

  /** Typed-and-deleted loop in the hero. */
  heroLines: [
    "AI Engineer",
    "Embedded & IoT",
    "LLMs on real devices",
    "I build things that think.",
  ],

  about: [
    "I'm a Computer Science graduate (FUE, 2024) in Cairo who builds Generative AI applications in Python, and the connected devices they run on.",
    "Wanas, my ESP32-S3 desk assistant, turns spoken commands into actions through Gemini; my graduation project read and validated Arabic ID cards with OCR.",
    "I also ship client work end to end, most recently a booking and payments platform now in production, and I'm growing into LLM agents, workflow automation and IoT connectivity.",
  ],

  email: "essamohmed8@gmail.com",
  links: {
    github: "https://github.com/3isa2002",
    linkedin: "https://www.linkedin.com/in/mohamed-eissa-952b77214",
    /** Full wa.me link. Left empty on purpose: no phone number on the site. */
    whatsapp: "",
  },

  /** PDFs live in public/cv/. Short share links /cv/ai and /cv/embedded redirect here. */
  cv: {
    ai: "/cv/mohamed-eissa-ai.pdf",
    embedded: "/cv/mohamed-eissa-embedded.pdf",
  },

  /** From the CVs (SPEC §5.4). Names must match project `stack` values to link up in the graph. */
  skills: [
    {
      id: "hardware",
      accent: "cyan",
      items: [
        "C/C++",
        "ESP32-S3",
        "Arduino",
        "Sensors",
        "SPI",
        "I2S",
        "Wi-Fi",
        "MQTT",
        "Networking",
      ],
    },
    {
      id: "ai",
      accent: "violet",
      items: [
        "Python",
        "Gemini API",
        "OpenAI API",
        "Prompt engineering",
        "Tesseract OCR",
        "OpenCV",
        "n8n",
      ],
    },
    {
      id: "tools",
      accent: "neutral",
      items: [
        "Java",
        "TypeScript",
        "Next.js",
        "Flutter",
        "Supabase",
        "PostgreSQL",
        "MySQL",
        "Git",
        "Linux",
        "Vercel",
      ],
    },
  ] satisfies SkillGroup[],
} as const;

export type Site = typeof site;
