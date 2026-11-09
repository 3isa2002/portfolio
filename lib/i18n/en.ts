/**
 * All UI strings in one dictionary (SPEC §1: i18n-ready for a later Arabic RTL version).
 * Content (bio, projects, experience) lives in content/; this file is only interface text.
 */
export const en = {
  meta: {
    title: "Mohamed Eissa — AI & Embedded Engineer",
    description:
      "Portfolio of Mohamed Eissa, a Cairo-based Junior AI Engineer (Generative AI) and Embedded & IoT Engineer.",
    projectsTitle: "Projects",
    projectsDescription: "Every project: AI, embedded systems and IoT.",
  },
  a11y: {
    skipToContent: "Skip to content",
    home: "Home",
    mainNav: "Main",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    filterProjects: "Filter projects by category",
    social: "Social links",
  },
  nav: {
    about: "About",
    projects: "Projects",
    skills: "Skills",
    contact: "Contact",
  },
  sections: {
    about: { label: "About", title: "From silicon to intelligence" },
    projects: { label: "Projects", title: "Selected work" },
    skills: { label: "Skills", title: "What I build with" },
    experience: { label: "Experience", title: "Where I've worked and studied" },
    contact: { label: "Contact", title: "Let's build something" },
  },
  hero: {
    eyebrowHardware: "Hardware",
    eyebrowAi: "AI",
    viewProjects: "View projects",
    downloadCv: "Download CV",
    cvAi: "AI Engineer CV",
    cvEmbedded: "Embedded & IoT CV",
    scrollCue: "Scroll",
  },
  about: {
    portraitAlt: "Portrait of Mohamed Eissa",
    timelineLabel: "Milestones",
  },
  projects: {
    all: "All",
    seeAll: "See all projects",
    empty: "No projects in this category yet.",
    backToProjects: "All projects",
    nextProject: "Next project",
    metrics: "Key metrics",
    github: "GitHub",
    live: "Live",
    watchDemo: "Watch demo",
    year: "Year",
    role: "Role",
    status: "Status",
    stack: "Stack",
    statuses: {
      shipped: "Shipped",
      "in-progress": "In progress",
      prototype: "Prototype",
    },
  },
  skills: {
    groups: {
      hardware: "Hardware",
      ai: "AI",
      tools: "Tools",
    },
    usedIn: "Used in",
  },
  experience: {
    work: "Work",
    education: "Education",
  },
  contact: {
    // Phase 6 (interactive terminal): change to "…? Type a command or use the buttons."
    intro: "Hiring for AI or embedded roles, or have a project in mind? Get in touch.",
    email: "Email me",
    copyEmail: "Copy email",
    copied: "Email copied",
    github: "GitHub",
    linkedin: "LinkedIn",
    whatsapp: "WhatsApp",
    terminalTitle: "mohamed@portfolio: ~",
    /** Terminal commands (SPEC §5.6) → one-line descriptions shown by `help`. */
    commands: {
      help: "list commands",
      email: "write to me",
      cv: "download a CV",
      github: "open GitHub",
      linkedin: "open LinkedIn",
      whatsapp: "message me",
      clear: "clear the screen",
    },
  },
  footer: {
    builtBy: "built by",
    lastDeploy: "last deploy",
    hint: "try",
  },
  notFound: {
    title: "Signal lost",
    line: "> error 404: signal lost",
    text: "The page you were looking for isn't on this board.",
    home: "Back home",
  },
} as const;

export type Dictionary = typeof en;
