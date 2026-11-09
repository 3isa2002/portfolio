# Portfolio Website — Build Spec for Claude Code

Nov 9, 2026 · @Eissa

## 0. Instructions to Claude Code

Build Mohamed Eissa's personal developer portfolio as a static, heavily animated, dark-mode site, following this spec phase by phase (section 10). It must cost $0/month to run.

Working rules:

1. Read this whole spec first, then write `PLAN.md` restating the phases and ask me about anything ambiguous before Phase 1.
2. Work one phase at a time. At the end of each phase: run the build, run Lighthouse on the home page, commit with a clear message, and show me what to look at.
3. Never hard-code project content inside components. All projects live in `content/projects/*.mdx` (section 6).
4. Every animation must have a reduced-motion fallback and must not block reading the content (section 8).
5. Use placeholder projects and media until I provide real ones; mark every placeholder with `TODO(mohamed)`.
6. Prefer well-maintained libraries listed here. Ask before adding any dependency not listed in section 2.
7. Keep all code in TypeScript (strict). No `any` unless commented why.

## 1. Overview and concept

The site's story is **"From Silicon to Intelligence"**: Mohamed works across Embedded/IoT hardware and AI/GenAI, so the visuals move from circuits (hardware) to neural networks (AI).

- **Owner:** Mohamed Eissa, Cairo. Junior AI Engineer (Generative AI) and Embedded & IoT Engineer.
- **Audience:** recruiters and engineering leads in Egypt and the Gulf. They decide in about 30 seconds, so projects must be reachable within one scroll or one click.
- **Goal:** a site that feels "from another world" while staying fast, readable and easy to update.
- **Language:** English first. Build i18n-ready (all UI strings in one dictionary, logical CSS properties) so Arabic RTL can be added later.
- **Visual motif:** two accent colors carry the story: electric cyan = hardware, violet = AI. Where they meet, they blend into one gradient.

What "done" looks like: a visitor sees a 3-second boot intro, lands on a living 3D background, scrolls through sections that animate in, opens any project into a full case study with media, and can contact Mohamed or download either CV.

## 2. Tech stack, hosting and cost

Decision: a **statically exported Next.js site on Cloudflare Pages**, with heavy media on Cloudflare R2. Running cost is $0/month; the only optional cost is a custom domain.

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (latest stable, App Router), TypeScript strict, `output: 'export'` | Largest React ecosystem; static export runs on any free host with no server |
| Styling | Tailwind CSS + CSS variables for tokens | Fast to build, tokens in one place |
| Scroll and timeline animation | GSAP + ScrollTrigger + SplitText | Industry standard for scroll-driven motion; free to use |
| UI and page transitions | Motion (Framer Motion): `layoutId`, `AnimatePresence` | Shared-element card → case-study transition |
| Smooth scroll | Lenis, synced to GSAP's ticker | Smooth scroll that ScrollTrigger can track |
| 3D | Three.js via React Three Fiber + drei + postprocessing (bloom) | Particle network background, chip in the intro, 3D board models |
| Content | MDX with Velite (typed frontmatter via Zod) | Add a project by adding one file |
| Code blocks | Shiki (build-time highlighting) | Zero runtime cost |
| Icons | Lucide | Light, consistent |
| Fonts | Space Grotesk, Inter, JetBrains Mono via `next/font` (self-hosted) | No layout shift, no external requests |
| Quality | ESLint, Prettier, Lighthouse CI in GitHub Actions | Keeps performance from drifting |

### Hosting comparison

| Option | Free tier | Fit |
| --- | --- | --- |
| **Cloudflare Pages (chosen)** | Unlimited bandwidth and static requests, 500 builds/month, 25 MB per file, commercial use allowed | Best: demo videos and 3D models can't run up a bill or hit a cap |
| Vercel Hobby | 100 GB bandwidth/month, personal non-commercial use only | Good backup; a personal portfolio qualifies |
| Firebase Hosting (Google), Spark plan | 10 GB storage, 360 MB/day transfer | Weakest here: a few visitors watching demo videos can use up 360 MB in a day |

### Media storage

- Images: AVIF/WebP, generated at build time in several widths, stored in the repo.
- Short loop videos (hover previews): MP4 (H.264) + WebM, muted, under 2 MB each, in the repo.
- Full demo videos and `.glb` 3D models over 10 MB: **Cloudflare R2** (10 GB free storage, no egress fees). Alternative: an unlisted YouTube embed, loaded only on click.

### Cost

| Item | Cost |
| --- | --- |
| Hosting (Cloudflare Pages) | $0 |
| Media (Cloudflare R2, under 10 GB) | $0 |
| Analytics (Cloudflare Web Analytics, cookieless) | $0 |
| Domain | $0 on `*.pages.dev`; a custom domain is optional and billed yearly |
| "Ask my AI" chatbot (optional, Phase 6) | $0 if built on a free LLM tier, decided later |

Deploy flow: push to GitHub `main` → Cloudflare Pages builds and deploys automatically; every other branch gets a preview URL.

Sources: [Cloudflare Pages pricing](https://pages.cloudflare.com/), [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits), [Firebase pricing](https://firebase.google.com/pricing), [Vercel Hobby limits](https://vpsranking.com/serverless/vercel/).

## 3. Design system

Dark only, near-black blue base, two story colors used sparingly so they glow. Define all values as CSS variables in `styles/tokens.css` and map them in the Tailwind config.

### Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#07070B` | Page background |
| `--bg-elev` | `#0E0E15` | Cards, panels |
| `--bg-elev-2` | `#15151F` | Hover states, modals |
| `--border` | `rgba(255,255,255,0.08)` | Hairlines, card borders |
| `--text` | `#EDEDF2` | Body and headings |
| `--text-dim` | `#8A8A9A` | Secondary text, labels |
| `--cyan` | `#22D3EE` | Hardware / Embedded / IoT accent |
| `--violet` | `#8B5CF6` | AI / GenAI accent |
| `--gradient` | `linear-gradient(135deg, var(--cyan), var(--violet))` | Name, key CTAs, active states |
| `--ok` | `#34D399` | Terminal "OK", success |

Rules: accents cover under 10% of any screen. Body text must pass WCAG AA contrast on `--bg`. Glow = `box-shadow`/bloom in the accent at low opacity, never on body text.

### Typography

| Role | Font | Size (desktop / mobile) |
| --- | --- | --- |
| Display (hero name) | Space Grotesk 700 | 96px / 48px, `clamp()` |
| H2 section titles | Space Grotesk 600 | 56px / 34px |
| H3 | Space Grotesk 600 | 28px / 22px |
| Body | Inter 400 | 18px / 16px, line-height 1.6 |
| Labels, tags, terminal, numbers | JetBrains Mono 400–500 | 13–15px, uppercase labels with letter-spacing 0.08em |

### Layout

- 12-column grid, max width 1280px, side padding 24px mobile / 48px desktop.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. Sections are separated by 128px on desktop.
- Radius: 12px cards, 999px pills. Subtle 1px borders instead of heavy shadows.
- A faint grid/noise texture overlay (2–3% opacity) on the background for depth.

### Motion principles

- **Easing:** `expo.out` for entrances, `power2.inOut` for transitions. Never linear except for loops.
- **Durations:** micro-interactions 150–250ms, reveals 600–900ms, page transitions 500–700ms, intro 3s max.
- **Choreography:** stagger children by 40–80ms; headings reveal by line, then body fades up 16px.
- **Only animate `transform` and `opacity`** (plus WebGL). No animating width/height/top/left.
- **Purpose:** every motion either tells the silicon → intelligence story, guides the eye to content, or confirms an action.

## 4. Boot intro sequence

A 3-second "device boot" plays on the first visit only, turns a chip into a neural network, and hands off into the hero without a cut. Build it as one GSAP master timeline in `components/intro/BootIntro.tsx`.

### Storyboard

| Time | What the visitor sees | How |
| --- | --- | --- |
| 0.0–0.3s | Black screen, blinking block cursor bottom-left | CSS caret blink |
| 0.3–1.0s | Firmware-style log types fast: `> init core ........ OK`, `> mounting sensors .. OK`, `> loading neural weights .. OK`, `> mohamed.eissa v2026 ready` | Monospace text, each line typed in about 120ms, "OK" in `--ok` |
| 1.0–1.6s | Log lines collapse to the center and become a glowing chip (square + pins) | Lines scale/translate into an SVG chip; cyan stroke draws in |
| 1.6–2.3s | Copper traces light up from the chip outward like current flowing, then branch | SVG `stroke-dashoffset` animation on trace paths, cyan glow |
| 2.3–2.8s | Trace endpoints become nodes; color shifts cyan → violet; nodes pulse as a neural network | Crossfade from SVG into the R3F particle network (same node positions) |
| 2.8–3.2s | Network contracts and the name `MOHAMED EISSA` resolves with a scramble effect; camera eases forward into the hero | Text scramble on the hero H1; the network stays as the background |

### Rules

- **Skip:** a `Skip intro →` button (bottom-right, visible from 0.3s), plus any click, scroll or key press, jumps to the final state in 300ms.
- **First visit only:** store `intro_seen=1` in `localStorage` (wrapped in try/catch). Return visits get a 600ms short version: name scramble only.
- **Reduced motion:** if `prefers-reduced-motion: reduce`, skip the intro entirely and fade the hero in.
- **No blocking:** the hero HTML is server-rendered underneath, so content is in the DOM and indexable even while the intro plays.
- **Sound:** off by default. An optional speaker toggle in the navbar enables a soft boot "hum" and UI ticks (Howler.js or plain Web Audio; files under 50 KB).

## 5. Site structure and sections

One long home page with six sections, plus one generated page per project and a 404. A persistent 3D background changes form as the visitor scrolls: **circuit** in the top sections, **neural network** from Projects down.

### Routes

| Route | Content |
| --- | --- |
| `/` | Home: all sections below |
| `/projects` | Full filterable project grid (same component as the home section, no limit) |
| `/projects/[slug]` | Case study page generated from MDX (section 6) |
| `/cv/ai` and `/cv/embedded` | Redirect to the two PDF CVs in `/public/cv/` |
| `/404` | Themed: `> error 404: signal lost`, with a link home |

### Persistent UI

- **Navbar:** logo mark (`ME` monogram drawn as a chip) left; links About, Projects, Skills, Contact; `⌘K` hint; sound toggle. Glass blur background after 80px of scroll; hides on scroll down, shows on scroll up.
- **Scroll progress:** a 2px gradient line at the top of the viewport.
- **Section index:** small mono labels on the right edge (`01 / 06`) that update with the active section.

### Home sections

1. **Hero:** name in display type with the gradient; a rotating line typed and deleted in a loop: `AI Engineer` → `Embedded Systems` → `IoT Builder` → `I build things that think.` Two CTAs: `View projects` and `Download CV` (menu: AI CV / Embedded CV). Scroll cue at the bottom: an animated signal line. The 3D network reacts to the cursor (nodes nearby brighten and lean toward it).
2. **About:** short intro (3 sentences, placeholder) next to a portrait or avatar slot. Below it, a horizontal timeline drawn on scroll (SVG path draws as you scroll, GSAP scrub): milestones from first microcontroller to first LLM project. Pin the section while the timeline draws on desktop; plain vertical list on mobile.
3. **Projects (featured):** filter pills (`All`, `AI`, `Embedded`, `IoT`) and up to 6 featured cards, then `See all projects →`. Details in section 6.
4. **Skills:** an interactive skill graph, not progress bars. Nodes grouped in three clusters: Hardware (C/C++, STM32, ESP32, Arduino, RTOS, sensors, MQTT…), AI (Python, PyTorch, LLMs, RAG, LangChain, Ollama, vector DBs…), Tools (Git, Docker, Linux, Next.js…). Hovering a skill lights the edges to the projects that used it (data comes from project frontmatter `stack`). Mobile: grouped tag chips. Skill names are placeholders until Mohamed confirms.
5. **Experience and education:** compact cards with role, place, dates, and 2 bullet outcomes each. Reveal with stagger.
6. **Contact:** a terminal panel. Visitor can type `help`, `email`, `cv`, `github`, `linkedin`, `whatsapp`, `clear`; each prints a response and/or opens the link. Normal clickable buttons sit beside the terminal for non-technical visitors. A `Copy email` button with a "copied" toast. No backend form in v1.

### Footer

Mono text: `built by Mohamed Eissa · Cairo · last deploy <build date>`, social icons, and a hint `try ⌘K`.

## 6. Projects system

Each project is one MDX file plus a media folder. Adding a project must never require touching components.

### Content model

Files: `content/projects/<slug>.mdx` and media in `public/projects/<slug>/`. Frontmatter, validated by Zod in Velite (the build fails on invalid data):

```yaml
title: "Reply Twin"
slug: "reply-twin"
summary: "Local LLM that drafts WhatsApp replies in my own style"   # max 120 chars
category: ["AI"]               # one or more of: AI, Embedded, IoT
featured: true
order: 1                       # sort order on the home page
year: 2026
status: "in-progress"          # shipped | in-progress | prototype
role: "Solo — design, data, model, app"
stack: ["Python", "Ollama", "RAG", "ChromaDB"]
cover: "cover.webp"            # 16:10
preview: "preview.mp4"         # muted hover loop, under 2 MB, optional
links:
  github: "https://github.com/..."
  live: ""
  video: ""                    # R2 URL or YouTube ID
gallery:
  - { src: "shot-1.webp", caption: "Chat import screen" }
metrics:
  - { label: "Response time", value: "1.2 s" }
model3d: ""                    # .glb URL, for hardware projects
demo: ""                       # name of an interactive demo component, optional
```

The MDX body holds the case-study text and can use these components: `<Architecture>`, `<Gallery>`, `<Video>`, `<Code>`, `<Callout>`, `<Board3D>`, `<Compare>` (before/after slider), `<Demo name="...">`.

### Project grid (home and `/projects`)

- Cards: cover image, title, one-line summary, category badge (cyan for Embedded/IoT, violet for AI), up to 4 stack tags, year.
- **Hover:** 3D tilt (max 8°) following the cursor, a light sheen across the card, border glow in the category color; the cover crossfades into the `preview` loop video if one exists. Touch devices: no tilt; preview plays when the card is 60% in view.
- **Filter:** pills animate card reflow with Motion `layout` (cards slide to new positions, filtered-out cards fade and scale to 0.95). Filter state goes into the URL (`?c=ai`).
- **Layout:** bento-style grid on desktop (the first featured card spans 2 columns), 2 columns tablet, 1 column mobile.

### Case study page `/projects/[slug]`

**Transition in:** the clicked card's cover expands into the page hero with a shared-element animation (`layoutId`), then content staggers in. The browser back button reverses it.

Page order:

1. **Hero:** full-width cover or video, title, summary, meta row (year, role, status, stack), and buttons for GitHub / Live / Watch demo.
2. **Key metrics:** 2–4 numbers that count up when scrolled into view.
3. **Problem → Approach → Result:** short prose from MDX.
4. **Architecture diagram:** `<Architecture>` takes nodes and edges from MDX and draws them as SVG; boxes appear in order and connecting lines draw with data "packets" flowing along them.
5. **Media:** `<Gallery>` masonry with a lightbox (zoom, swipe, keyboard arrows, captions); `<Video>` with a custom player, loaded only when clicked or scrolled near.
6. **Code highlights:** 1–3 snippets with Shiki, file name tab and a copy button.
7. **Hardware extras (Embedded/IoT):** `<Board3D>` loads the `.glb` lazily and lets the visitor orbit, zoom and click hotspots that label components and pins.
8. **Next project:** a large card linking to the next project, previewing its cover on hover.

### Interactive demos

Demos are optional React components in `components/demos/`, loaded with dynamic import only on the page that uses them. They must run fully in the browser with no paid API.

- **Reply Twin demo:** a fake WhatsApp-style chat. The visitor picks a sample incoming message; the "bot" types out a pre-recorded reply with a typing indicator. A note says replies are pre-generated from the real local model.
- **IoT dashboard demo:** a simulated live sensor chart (temperature/humidity) with generated data and a toggle that "switches a relay".

## 7. Signature interactions

These details make the site feel "from another world". All are desktop-first and degrade to simple versions on touch devices or under reduced motion.

| Interaction | Behavior | Touch / reduced motion |
| --- | --- | --- |
| 3D background | R3F particle field (about 1,500 points on desktop, 400 on mobile) connected by lines within a distance threshold, with bloom. Morphs between a grid-like "circuit" layout and an organic "neural" layout, driven by scroll progress. Slow drift; nodes near the cursor brighten. Caps at 60 fps, pauses when the tab is hidden. | Static gradient + noise image |
| Custom cursor | Small dot + trailing ring (lerp). Ring grows over links, becomes `VIEW` over project cards, `DRAG` over 3D models. | Native cursor |
| Magnetic buttons | CTAs pull toward the cursor within 60px and spring back. | Off |
| Text reveals | Headings split into lines/chars (SplitText) and slide up from a mask on scroll. A scramble effect on the hero name and section labels. | Simple fade |
| Scroll-linked sections | About timeline pinned and scrubbed; section numbers count; the background morph follows scroll. | Unpinned, static |
| Command palette | `⌘K` / `Ctrl+K` opens a palette (use `cmdk`): jump to sections, open any project, copy email, download either CV, toggle sound. | Same, opened from a navbar button |
| Terminal contact | See section 5. Command history with ↑/↓, tab completion. | Buttons beside it |
| Page transitions | Shared-element card → case study; other routes use a quick "scanline" wipe (cyan line sweeps across, 500ms). | Crossfade |
| Easter egg | Typing the Konami code (↑↑↓↓←→←→BA) switches the background into a "matrix rain" of binary and logs `> overclock mode enabled` in the terminal. | Same |
| Micro-feedback | Hover sounds (if sound is on), "copied" toasts, link underlines that draw in. | Visual only |

Dependency note: `cmdk` and (optionally) Howler.js for sound are the only libraries allowed beyond section 2.

## 8. Performance, accessibility, mobile, SEO

The animation must never cost the content: these targets are acceptance criteria for every phase, not polish for the end.

### Performance budgets

| Metric | Target |
| --- | --- |
| Lighthouse Performance (mobile) | 90 or higher |
| Lighthouse Accessibility, Best Practices, SEO | 95 or higher |
| Largest Contentful Paint | under 2.5 s on 4G |
| Cumulative Layout Shift | under 0.05 |
| Initial JS (home, gzipped) | under 200 KB before the 3D chunk |
| 3D chunk (three + R3F + scene) | loaded after first paint, via dynamic import, `ssr: false` |
| Per-image weight | under 200 KB (AVIF/WebP, responsive `srcset`) |

Techniques: lazy-load everything below the fold; load the WebGL scene with `requestIdleCallback`; use `IntersectionObserver` to pause off-screen animations and videos; preload only the display font; reduce particle count and turn off bloom when the GPU is weak (use drei's `PerformanceMonitor` to downgrade when fps stays under 45 for 2 s).

### Accessibility

- Respect `prefers-reduced-motion` everywhere (one `useReducedMotion` hook, used by GSAP, Motion, Lenis and the 3D scene).
- Full keyboard navigation, visible focus rings in the accent color, focus trapped in the lightbox and command palette, `Esc` closes overlays.
- Semantic HTML: one `h1`, landmarks, `alt` on every image, captions on demo videos.
- The custom cursor never hides the native cursor for keyboard or screen-reader users.

### Mobile

- Design mobile layouts for every section, not just shrunk desktop.
- No pinning, no custom cursor, no tilt; native scrolling (Lenis off on touch).
- Tap targets at least 44px.
- Test at 360px, 390px, 768px, 1280px and 1920px widths.

### SEO and sharing

- Per-page `<title>`, meta description and Open Graph image. Generate OG images at build time per project (title + cover on the site's dark style).
- `sitemap.xml`, `robots.txt`, JSON-LD `Person` on the home page and `CreativeWork` on each project.
- Canonical URLs; favicon set from the `ME` chip logo.

## 9. Repo structure

One Next.js app at the repo root; content and media stay separate from components so projects can be added without code changes.

```text
portfolio/
├─ app/
│  ├─ layout.tsx            # fonts, providers (Lenis, sound, cursor), navbar, background canvas
│  ├─ page.tsx              # home: composes sections
│  ├─ projects/page.tsx     # full grid
│  ├─ projects/[slug]/page.tsx  # case study (generateStaticParams)
│  └─ not-found.tsx
├─ components/
│  ├─ intro/                # BootIntro, ChipSVG, TerminalLog
│  ├─ three/                # BackgroundScene, ParticleNetwork, Board3D
│  ├─ sections/             # Hero, About, Timeline, Projects, Skills, Experience, Contact
│  ├─ projects/             # ProjectCard, ProjectGrid, Filter, CaseStudyHero
│  ├─ mdx/                  # Architecture, Gallery, Lightbox, Video, Code, Callout, Compare, Demo
│  ├─ demos/                # ReplyTwinDemo, IoTDashboardDemo
│  └─ ui/                   # Cursor, MagneticButton, CommandPalette, Terminal, Toast, SplitReveal
├─ content/
│  ├─ projects/*.mdx
│  ├─ site.ts               # name, links, email, rotating hero lines, about text
│  ├─ timeline.ts           # About milestones
│  └─ experience.ts
├─ lib/                      # gsap setup, useReducedMotion, useSound, velite helpers, i18n dictionary
├─ public/
│  ├─ projects/<slug>/      # cover, preview, gallery images
│  ├─ cv/                   # mohamed-eissa-ai.pdf, mohamed-eissa-embedded.pdf
│  ├─ sounds/
│  └─ _redirects            # Cloudflare Pages redirects (/cv/ai, /cv/embedded)
├─ styles/tokens.css
├─ velite.config.ts
├─ .github/workflows/lighthouse.yml
└─ PLAN.md
```

Edit points for Mohamed: `content/site.ts` for personal info, `content/projects/` for projects, `public/cv/` for CVs. Document these three in the README.

## 10. Build phases

Eight phases, each ending in a deployed preview Mohamed can open. Content and structure come first, so the site is usable before the effects land; the intro comes after the 3D scene because it hands off into it.

1. **Phase 0 — Setup and deploy pipeline**
   - Next.js + TypeScript strict + Tailwind + tokens + fonts; static export; ESLint/Prettier.
   - GitHub repo connected to Cloudflare Pages; Lighthouse CI workflow.
   - Done when: a placeholder page is live on `*.pages.dev` and every push redeploys.
2. **Phase 1 — Layout and content model**
   - Navbar, footer, all six home sections with static placeholder content, mobile layouts.
   - Velite schema, 3 placeholder projects (one AI, one Embedded, one IoT), grid without effects, case-study pages, 404, CV redirects.
   - Done when: adding a new `.mdx` file creates a new card and page with no code changes.
3. **Phase 2 — Motion foundation**
   - `useReducedMotion`, Lenis + GSAP ticker sync, SplitText reveals, scroll progress, custom cursor, magnetic buttons, About timeline scrub.
   - Done when: every section animates in, and with reduced motion enabled everything is static and readable.
4. **Phase 3 — 3D background**
   - R3F particle network, circuit ↔ neural morph on scroll, cursor reaction, bloom, `PerformanceMonitor` downgrade, static fallback on mobile/low GPU.
   - Done when: 60 fps on a mid laptop, Lighthouse mobile Performance still 90+.
5. **Phase 4 — Boot intro**
   - Full storyboard from section 4, skip, first-visit logic, short return version, handoff into the 3D scene.
   - Done when: intro is 3.2 s or less, skippable at any moment, and never shows twice in a row.
6. **Phase 5 — Projects experience**
   - Card tilt, hover preview videos, animated filter, shared-element transition, `Architecture`, `Gallery` + lightbox, `Video`, `Board3D`, count-up metrics, next-project card.
   - Reply Twin and IoT dashboard demos.
   - Done when: open/close of a case study is smooth both ways, including the browser back button.
7. **Phase 6 — Extras and SEO**
   - Command palette, terminal contact, Konami easter egg, optional sound, OG images, sitemap, JSON-LD, Cloudflare Web Analytics.
   - Optional, only if Mohamed approves: "Ask my AI" chat widget via a Cloudflare Pages Function and a free LLM tier, answering from his CV only.
   - Done when: all Lighthouse targets in section 8 pass.
8. **Phase 7 — Real content and launch**
   - Replace every `TODO(mohamed)` with real text, projects, media and CVs; compress media; move large files to R2.
   - Test on Chrome, Safari, Firefox and a real Android and iPhone; connect a custom domain if bought.
   - Done when: no placeholders remain and the site is shared publicly.

## 11. Inputs needed from Mohamed

Phases 0–6 can run on placeholders; these items are needed before Phase 7 (launch). Claude Code should ask for them, not invent them.

- [ ] Short bio (3 sentences) and the 4–6 milestones for the About timeline
- [ ] Final list of projects: title, one-line summary, category, stack, year, status, GitHub/live links
- [ ] Media per project: cover image, 5–10 s screen recording for the hover loop, screenshots, full demo video if any, `.glb` model for hardware projects if any
- [ ] Both CV PDFs (AI Engineer and Embedded & IoT)
- [ ] Contact links: email, GitHub, LinkedIn, WhatsApp (optional)
- [ ] Confirmed skill list for the Skills graph
- [ ] Experience and education entries
- [ ] Portrait photo or decision to use an avatar
- [ ] Decision: buy a custom domain, or stay on `*.pages.dev`
- [ ] Decision: build the optional "Ask my AI" widget or not
- [ ] Decision: add Arabic (RTL) in a later version or not
