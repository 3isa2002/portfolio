# PLAN — Mohamed Eissa Portfolio

Restates `SPEC.md` as a working plan. The spec stays the source of truth; this file tracks
phase status, decisions, and open questions.

## Ground rules (from SPEC §0)

- One phase at a time. Each phase ends with: `build` passes → Lighthouse on `/` → commit → short "what to look at" note.
- No project content inside components. Projects live only in `content/projects/*.mdx`.
- Every animation has a reduced-motion fallback and never blocks reading.
- Placeholders everywhere until real content arrives, each marked `TODO(mohamed)`.
- Dependencies: only those in SPEC §2 plus `cmdk` and (optional) Howler.js. Anything else → ask first.
- TypeScript strict. No `any` without a comment explaining why.
- Cost: $0/month (Cloudflare Pages + R2 + Web Analytics).

## Stack (locked)

Next.js (latest stable, App Router, `output: 'export'`) · TypeScript strict · Tailwind + CSS-variable
tokens (`styles/tokens.css`) · GSAP + ScrollTrigger + SplitText · Motion · Lenis · Three.js / R3F /
drei / postprocessing · MDX via Velite (Zod schemas) · Shiki · Lucide · `next/font` (Space Grotesk,
Inter, JetBrains Mono) · ESLint + Prettier · Lighthouse CI · pnpm.

## Phases

| #   | Phase                     | Main deliverables                                                                                                                                                                                                                               | Done when                                                                        | Status          |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------- |
| 0   | Setup and deploy pipeline | Next.js + TS strict + Tailwind + tokens + fonts, static export, ESLint/Prettier, GitHub repo, Cloudflare Pages, Lighthouse CI workflow                                                                                                          | Placeholder page live on `*.pages.dev`, every push redeploys                     | ✅ done         |
| 1   | Layout and content model  | Navbar, footer, 6 home sections (static placeholders, real mobile layouts), Velite schema, 3 placeholder projects (AI / Embedded / IoT), grid without effects, case-study pages, `/projects`, 404, CV redirects (`_redirects`), i18n dictionary | Adding a new `.mdx` creates a card + page with no code changes                   | ✅ done (PR #1) |
| 2   | Motion foundation         | `useReducedMotion`, Lenis ↔ GSAP ticker, SplitText reveals, scroll progress bar, custom cursor, magnetic buttons, About timeline scrub (pinned on desktop)                                                                                      | Every section animates in; with reduced motion everything is static and readable | ✅ done (PR #2) |
| 3   | 3D background             | R3F particle network (1,500 desktop / 400 mobile), circuit ↔ neural morph on scroll, cursor reaction, bloom, `PerformanceMonitor` downgrade, static fallback                                                                                    | 60 fps on a mid laptop; Lighthouse mobile Perf still ≥ 90                        | ✅ done (PR #3) |
| 4   | Boot intro                | Full 3.2 s storyboard (SPEC §4), skip button + any input skips, first-visit `localStorage`, 600 ms return version, handoff into the 3D scene                                                                                                    | ≤ 3.2 s, skippable any moment, never shows twice in a row                        | ✅ done (PR #4) |
| 5   | Projects experience       | Card tilt + sheen + glow, hover preview video, animated filter (`?c=`), shared-element card → case study, `Architecture`, `Gallery` + lightbox, `Video`, `Board3D`, count-up metrics, next-project card, Reply Twin + IoT dashboard demos       | Case study open/close smooth both ways, incl. browser back                       | ✅ done (PR #5) |
| 6   | Extras and SEO            | `⌘K` palette, terminal contact, Konami egg, optional sound, build-time OG images, sitemap, robots, JSON-LD, Cloudflare Web Analytics. Optional "Ask my AI" only if approved                                                                     | All Lighthouse targets in SPEC §8 pass                                           | ✅ done (PR #6) |
| 7   | Real content and launch   | Replace every `TODO(mohamed)`, compress media, large files → R2, cross-browser + real-device testing, custom domain if bought                                                                                                                   | No placeholders remain; site shared publicly                                     | 🚧 in progress  |

## Acceptance targets (every phase, SPEC §8)

Lighthouse mobile: Performance ≥ 90; Accessibility, Best Practices, SEO ≥ 95 · LCP < 2.5 s (4G) ·
CLS < 0.05 · initial home JS < 200 KB gzipped before the 3D chunk · 3D loaded after first paint
(`dynamic`, `ssr: false`, `requestIdleCallback`) · images < 200 KB each.

## Technical notes / decisions

- **Static export + images:** `next/image` optimization does not run with `output: 'export'`.
  `scripts/optimize-images.mts` (sharp) writes AVIF + WebP at the widths in `lib/image-widths.json` to
  `public/_img/` (git-ignored, incremental); `lib/image-loader.ts` is the custom `next/image` loader and
  `components/ui/Picture.tsx` emits `<picture>` with both formats.
- **SplitText:** included free in the `gsap` package since GSAP 3.13; no extra dependency.
- **Shiki:** wired into Velite's MDX pipeline via Shiki's own rehype integration (`@shikijs/rehype`).
- **Redirects:** `/cv/ai` and `/cv/embedded` via `public/_redirects` (works on Cloudflare, not in `next dev`).
- **i18n-ready:** all UI strings in `lib/i18n/en.ts`; logical CSS properties only (`ms-`, `pe-`, `inset-inline`…).
- **Content build:** `velite build --strict` runs before `next build`/`dev`/`typecheck`; any schema error or
  missing media file fails the build. `#site/content` is the generated import.
- **Segment prefetch workaround:** Next 16.4 static export writes nested prefetch payloads as folders
  (`__next.projects/__PAGE__.txt`) but the router requests dot-joined names (`__next.projects.__PAGE__.txt`),
  so every nested prefetch 404s. `scripts/fix-segment-prefetch.mts` (post-build) mirrors them. Remove when fixed upstream.
- **Scheduling notes:** navbar hide-on-scroll and glass-after-80px → Phase 2 (scroll motion); `⌘K` hint, sound
  toggle and footer "try ⌘K" → Phase 6 (they would be dead UI before then); interactive Skills graph (desktop)
  is not assigned to a phase in the spec → planned for Phase 5 with the projects work (it reads project `stack`).
- **Motion engine:** `lib/motion/engine.ts` (GSAP + ScrollTrigger + SplitText + ScrambleText + Lenis,
  ≈ 56 KB gz) is a separate chunk imported on the visitor's first interaction (scroll, wheel, pointer,
  touch, key) or after 4 s, so it never runs during page load. Components stay server-rendered and opt
  in with data attributes (`data-reveal`, `data-scramble`, `data-magnetic`, `data-cursor`,
  `data-timeline*`). Everything is created inside `gsap.matchMedia` keyed on the queries in
  `lib/motion/media.ts`, which also exports `useReducedMotion`; turning reduced motion on reverts it all.
  Content already on screen when the engine starts is never hidden (no blink).
- **3D background:** `components/three/BackgroundLayer.tsx` always renders a static gradient + noise
  layer (first paint, reduced motion, no WebGL, weak device) and, on the first interaction + idle,
  loads `NetworkScene` (three + R3F + drei, ≈ 235 KB gz, own chunk; bloom/postprocessing ≈ 22 KB in a
  further chunk, desktop only). Positions are computed in shaders from two precomputed layouts
  (`lib/three/network.ts`), so the CPU cost per frame is a few uniforms. Render loop capped at 60 fps,
  stops in hidden tabs. Quality levels (`lib/three/levels.ts`): desktop `full` (1,500 points + bloom),
  phones `lite` (400 points), drei `PerformanceMonitor` < 45 fps for 2 s → `reduced` (750, no bloom)
  → static. Decided 2026-11-09: phones get the light 3D, not static (SPEC §7 vs §10 conflict).
- **Boot intro:** `components/intro/IntroScript.tsx` (inline, before first paint) sets
  `<html data-intro>` to `full` (first visit to `/`, stores `intro_seen=1` at once), `short` (return
  visit: 600 ms name scramble) or `calm` (reduced motion: hero fades in). `BootIntro.tsx` runs one GSAP
  timeline (GSAP imported after first paint). The real hero is never hidden: the name resolves on a
  canvas laid exactly over the heading (a canvas is never an LCP candidate), then the overlay fades.
  A CSS failsafe hides the overlay after 6 s if the timeline never starts. Desktop starts loading the
  3D scene when the intro starts, so it is there at the handoff; phones keep loading it on the first
  interaction. Sound (spec §4) is scheduled with the navbar toggle in Phase 6.
- **Card → case study transition:** React `<ViewTransition>` (React 19.3 + Next 16 App Router,
  browser View Transitions API) instead of Motion `layoutId`: the cover shares `cover-<slug>` between
  the card and the case-study hero and morphs; content rises in after it. Motion's `layoutId` does not
  survive an App Router route change reliably; ViewTransition is built for it and degrades to an
  instant swap without browser support. React runs `popstate` transitions synchronously (no view
  transition), so `components/motion/BackTransitions.tsx` starts the transition itself on Back/Forward
  and hands the event to Next's router after the old frame is captured: Back reverses the morph.
- **Motion (filter reflow)** is loaded on the first intent to filter (pointer over / focus on the pills;
  a click waits for it), keeping ~50 KB out of the home page's initial JS.
- **Media without ffmpeg:** placeholder clips (`preview.webm`, `demo.webm`) were recorded in headless
  Chrome from a canvas with MediaRecorder; placeholder screenshots are sharp-rendered SVGs. All are
  `TODO(mohamed)`.
- **SEO at build time:** `app/opengraph-image.tsx` and `app/projects/[slug]/opengraph-image.tsx`
  render share images with `next/og` (`lib/og.tsx`); the TTF of Space Grotesk is fetched from Google
  Fonts during the build (falls back to the built-in font). Static export writes them without an
  extension, so `public/_headers` sets `Content-Type: image/png` on Cloudflare. `sitemap.ts`,
  `robots.ts` and the OG routes need `dynamic = "force-static"` under `output: 'export'`.
- **Sound** is synthesized with Web Audio (`lib/sound.ts`): no audio files, no Howler. On by default
  (decided 2026-11-09); browsers allow audio only after the first click/tap/key, so it starts then.
- **Boot intro on every home visit** (decided 2026-11-09, replaces SPEC §4 "first visit only" and the
  600 ms return version): every page load of `/` and every client-side navigation back to it (links,
  browser Back) plays the full intro; reduced motion never does. Skip reacts only to visitor input
  (click, wheel, touch, key), not `scroll`, which also fires on Back's scroll restoration.
- **Decisions (2026-11-09):** Cloudflare Web Analytics enabled from the Pages dashboard (no code);
  "Ask my AI" skipped for now.
- **LCP in CI is a warning (decided 2026-11-09):** Lighthouse CI simulates Slow 4G, stricter than the
  spec's "4G". Its simulated LCP sits at ≈ 2.5–2.7 s even for the Phase 0 placeholder page (the floor is
  the Next/React runtime), while observed LCP is ≈ 0.4 s. CI keeps hard gates on Perf ≥ 90, A11y / BP /
  SEO ≥ 95 and CLS ≤ 0.05; `largest-contentful-paint` > 2.5 s only warns. Real-user LCP is tracked with
  Cloudflare Web Analytics from Phase 6.
- **Phase numbering:** the spec's rule "ask before Phase 1" is read as "ask before starting any code" (Phase 0).

## Decisions (answered 2026-11-09)

1. **Repo:** `3isa2002/portfolio`, public.
2. **Cloudflare:** Mohamed connects the repo in the Cloudflare dashboard (Pages → Connect to Git).
   Build command `pnpm build`, output dir `out`.
3. **Git workflow:** one branch + PR per phase (`phase-N-<name>`); each PR gets a Cloudflare preview URL; merge to `main` deploys production.
4. **Images:** custom prebuild script with `sharp` + a `<Picture>` component. No new dependency.

## Phase log

### Phase 0 — Setup and deploy pipeline (2026-11-09)

- Next.js 16.4.5 (App Router, Turbopack), React 19.3, Tailwind 4.3 (CSS-first `@theme`, so tokens are
  mapped in `app/globals.css` rather than a JS config), TypeScript 5.9 strict + `noUncheckedIndexedAccess`.
- `output: 'export'`, `experimental.inlineCss` (removes the render-blocking CSS request; FCP 1.8 s → 1.4 s).
- Fonts via `next/font`; only Space Grotesk is preloaded.
- CI: `.github/workflows/lighthouse.yml` runs typecheck, lint, Prettier, build, then Lighthouse CI (mobile, 3 runs).
- Phase 0 is committed straight to `main` (it bootstraps the branch Cloudflare deploys). Phases 1+ use branch + PR.
- Local Lighthouse (mobile, Slow-4G simulated, 3 runs): Perf 94–99 · A11y 100 · BP 100 · SEO 100 · CLS 0 ·
  LCP 1.3–2.6 s simulated (194 ms observed).
- Live at https://mohamed-eissa.pages.dev (Cloudflare Pages project `mohamed-eissa`; `portfolio.pages.dev` was taken).
  Live Lighthouse (mobile, 3 runs): Perf 90–99 (median 97) · A11y 100 · BP 100 · SEO 100 · CLS 0 · LCP 1.0–2.9 s (median 2.2 s).

### Phase 1 — Layout and content model (2026-11-09)

- Velite schema (`velite.config.ts`) with Zod validation incl. a media-exists check; 3 placeholder projects
  (Reply Twin / AI, STM32 Motor Controller / Embedded, Home Sensor Hub / IoT) with generated placeholder covers.
- Home: Hero, About (+ timeline: vertical mobile, horizontal desktop), Projects (bento, filter in `?c=`), Skills
  (grouped chips with per-skill project counts from `stack`), Experience, Contact (static terminal + buttons).
- `/projects`, `/projects/[slug]` (hero, meta, metrics, MDX + Shiki, next project), themed 404, CV PDFs
  (placeholders) + `/cv/ai`, `/cv/embedded` redirects, all UI strings in `lib/i18n/en.ts`.
- Done check: a temporary `done-check.mdx` produced `/projects/done-check` and a grid card with no code change.
- Layout verified at 360 / 390 / 768 / 1280 / 1920: no horizontal overflow; 1 / 2 / 3 grid columns.
- Perf fixes: Inter 400-only and JetBrains Mono 400-only (font bytes 101 → 67 KB); hero top-anchored so the
  body-font swap cannot shift the name (CLS 0.083 → ≤ 0.023); logo link accessible name = visible name.
- Local Lighthouse (mobile, 3 runs): home Perf 96 · A11y 100 · BP 100 · SEO 100 · CLS 0–0.023 · LCP 2.7 s
  simulated (observed ≈ 0.4 s). Case study Perf 94–96, others 100.
- CI's LCP assertion changed from error to warning (see technical notes).
- Merged as PR #1 (79ad1d7); production deploy from `main`.

### Phase 2 — Motion foundation (2026-11-09)

- Added `gsap` 3.15 and `lenis` 1.3 (both in SPEC §2). SplitText and ScrambleText ship inside `gsap`.
- `useReducedMotion` + shared media queries (`lib/motion/media.ts`); Lenis on mouse/trackpad only, synced
  to GSAP's ticker; in-page anchor links scroll with Lenis and move focus to the target.
- Reveals: headings split into masked lines, section labels scramble from binary, body fades up 16px,
  grids stagger 60ms; case-study prose reveals block by block.
- About timeline: pinned and scrubbed on desktop (trace draws, milestones light up); on touch/mobile
  the vertical trace draws on scroll without pinning.
- Persistent UI: 2px scroll progress line, right-edge section index (`02 / 06 · About`, desktop), navbar
  transparent → glass after 80px, hides on scroll down, returns on scroll up or keyboard focus.
- Hero: typed/deleted line loop (fixed-height box, so no layout shift), scroll cue signal pulse.
- Custom cursor (dot + lagging ring, grows on links, `VIEW` on project cards) and magnetic CTAs, mouse only.
- Verified: reduced motion (Chrome `--force-prefers-reduced-motion`) leaves no split, hidden or smoothed
  element; mobile has no Lenis, cursor or pin and no horizontal overflow; client navigation re-scans.
- Initial home JS 184.5 KB gz (main: 182.7 KB; the engine is not in it).
- Local Lighthouse (mobile, 3 runs): home Perf 96 · A11y 100 · BP 100 · SEO 100 · CLS 0–0.023 ·
  TBT ≈ 85 ms · LCP 2.7 s simulated. Case study Perf 96, others 100.
- Merged as PR #2 (e4311aa); production deploy from `main`.

### Phase 3 — 3D background (2026-11-09)

- Added `three` 0.187, `@react-three/fiber` 9.8, `@react-three/drei` 10.7, `@react-three/postprocessing`
  3.2 + `postprocessing` 6.39 (all SPEC §2), `@types/three`.
- Circuit layout: PCB traces on a grid (right angles, 45° chamfers, three depth layers). Neural layout:
  ~12% of points become neurons in columns, each wired to its 3 nearest in the next column; the rest
  is dim dust. Morph is staggered per point, driven by scroll (About top → Projects mid-screen);
  project pages are neural. Cursor: nearby nodes lean in and brighten (mouse only). Dimmer behind content.
- Shared `onFirstInteraction` / `whenIdle` helpers (`lib/motion/wake.ts`) for the motion engine and 3D.
- Body background moved to `<html>` so fixed background layers show through.
- Measured in Chrome (headless, real GPU): Intel UHD integrated GPU, 1440×900, `full` level: slowest
  frame 4 ms (60 fps cap held), no downgrade. Phone emulation: `lite`. SwiftShader (software GL): 5 fps
  → stepped down to `reduced`, which runs at 49 fps and holds. Reduced motion: static only, 3D chunk
  never downloaded. WebGL disabled: static, motion engine still on.
- Cost after the first interaction on a 4× throttled phone: long tasks 107–363 ms (≈ 600 ms blocking),
  mostly compiling three.js; scrolling stays on the compositor (no Lenis on touch, passive listeners).
- Local Lighthouse (mobile, 3 runs): home Perf 96 · A11y 100 · BP 100 · SEO 100 · CLS 0 · TBT ≈ 55 ms.
  Case study Perf 96. Lighthouse ends before the first-interaction load, so the 3D cost is measured
  separately (above).
- Merged as PR #3 (125fda8); production deploy from `main`.

### Phase 4 — Boot intro (2026-11-09)

- Storyboard (SPEC §4): caret → firmware log typing with green OK → log collapses into an SVG chip
  (stroke draws in) → traces light up outward and branch → trace ends become nodes, cyan → violet,
  synapses fade in, pulse → network contracts, name resolves, page appears. Chip/trace geometry is
  generated from a fixed seed (`components/intro/chip-geometry.ts`); shared PRNG in `lib/random.ts`.
- Skip: `Skip intro →` button (from 0.3 s) or any click, wheel, scroll, touch or key: ends in 300 ms.
- Verified in Chrome: first paint → end 3.18 s; skip by key 302 ms; skip button; second visit gets the
  short version; reduced motion: no overlay, hero fades in; all JS blocked: overlay hides itself;
  canvas name pixel-aligned with the real heading on desktop and on a 390 px phone (two lines);
  desktop handoff: the 3D canvas is on (`full`) when the intro ends.
- Lighthouse runs as a first visit, so it always plays the full intro. Two fixes kept it fast:
  the name scramble moved from a text copy to a canvas (the copy became a late LCP candidate:
  LCP 3.6 s), and GSAP now loads after first paint (work before the observed LCP inflated Lantern's
  simulated LCP). Local Lighthouse (mobile, 3 runs): home Perf 90 / 95 / 94 · A11y 100 · BP 100 ·
  SEO 100 · LCP 2.8 s simulated (observed ≈ 0.7 s) · CLS 0–0.023 · TBT 100–250 ms (GSAP + timeline).
- Initial home JS 189 KB gz (+3 KB).
- Preview check: first paint → end 3.15 s (3 runs) after letting the timeline absorb up to 0.6 s of GSAP
  download (it was 3.33 s on the real network).
- Merged as PR #4 (7f39f68); production deploy from `main`.

### Phase 5 — Projects experience (2026-11-09)

- Cards: 3D tilt toward the cursor (max 8°), cursor-following sheen, border glow in the category colour,
  cover → `preview` loop crossfade on hover; touch: preview plays at 60% in view; reduced motion: no tilt
  or autoplay. Filter: Motion `layout` reflow, leaving cards fade + scale to 0.95, state in `?c=`.
- Case study: shared-element cover morph in and back (incl. the browser Back button), content rises in,
  metrics count up (screen readers keep the real value), demo section from frontmatter `demo`.
- MDX blocks: `<Architecture>` (build-time SVG, ranked layout, horizontal desktop / vertical phone, SMIL
  data packets, boxes and lines draw in), `<Gallery>` (masonry with build-time image sizes; native
  `<dialog>` lightbox: arrows, swipe, zoom, captions, Esc, focus return), `<Video>` (custom controls,
  `preload=none` until near, captions track; YouTube IDs load youtube-nocookie only on click),
  fenced code with file tab + copy button, `<Compare>` (keyboard-accessible slider), `<Board3D>`
  (lazy R3F: orbit, zoom buttons, numbered pins; touch starts locked; placeholder board until a .glb),
  `<Demo>`. Reply Twin chat demo and IoT dashboard demo (seeded data, relay switch), each its own chunk.
- Skills: interactive graph on desktop (lines from each skill to the projects using it, hover/focus to
  light them); chips on phones/tablets.
- Fixes found while testing: the next-project card no longer shares a transition name with grid
  cards; Board3D's WebGL check waits until the board is near (it cost ~1 s of main thread on load:
  Perf 68 → 94); dimmer 3D background on case studies.
- Verified in Chrome: no page or hydration errors on all 5 pages; filter animation sampled mid-flight;
  view-transition groups recorded forward and back; lightbox, video, demos, board pins, compare,
  skill graph; phone (touch preview, locked board, vertical diagram, no overflow); reduced motion.
- Initial JS: home 193.9 KB gz, /projects 187.3 KB, case study 189.8 KB (all under 200 KB).
- Local Lighthouse (mobile): home Perf 92–94 (6 runs, one outlier at 87) · case studies 92–94 ·
  /projects 94 · A11y / BP / SEO 100 everywhere · CLS ≤ 0.023.
- Preview check found an unhandled AbortError after Back (our transition replaced by React's); fixed.
- Merged as PR #5 (b12980d); production deploy from `main`.

### Phase 6 — Extras and SEO (2026-11-09)

- Command palette (`cmdk` 1.1, loaded on first open): ⌘K / Ctrl+K anywhere, navbar button, footer hint;
  sections, every project, copy email, both CVs, GitHub/LinkedIn, sound toggle. Focus returns to where
  it was on close.
- Contact terminal: help, email, cv, github, linkedin, whatsapp, clear; ↑/↓ history; Tab completes a
  partly typed command (an empty prompt lets Tab move on); `help` output prerendered for no-JS.
- Konami code: binary "matrix rain" background (lazy chunk) + `> overclock mode enabled` in the
  terminal; again to turn off.
- Sound toggle in the navbar (aria-pressed, remembered): boot hum when switched on and with the
  return-visit name scramble, soft ticks on link/button hover.
- Scanline page transition (SPEC §7) for ordinary route changes; card ↔ case study (typed
  nav-forward / nav-back, incl. browser Back) keeps the cover morph; reduced motion: crossfade.
- SEO: per-page OG images (home + each project), Twitter large card, canonical URLs, sitemap.xml,
  robots.txt, JSON-LD Person (home) and CreativeWork (projects), apple-icon.
- Verified in Chrome: palette open/search/navigate/Esc + focus return; terminal commands, history,
  completion, Tab leaves an empty prompt; Konami rain + log; sound toggle persisted; scanline on plain
  links; robots/sitemap/OG/icon served; no console errors; navbar fits at 360 px.
- Initial JS: home 198.0 KB gz (budget 200 KB — little headroom left), /projects 190.4, case study 192.7.
- Local Lighthouse (mobile): home Perf 93 / 93 / 75 / 90 / 94 / 93 / 84 (median 93; the low runs are
  React hydration and the intro's GSAP stretching under machine load, no lazy chunk involved) · case
  studies 93–94 · /projects 90 · A11y / BP / SEO 100 everywhere · CLS 0.
- Preview check: OG images served as image/png via `_headers`; no console errors.
- Merged as PR #6 (d955218); production deploy from `main` (first one with Web Analytics).

### Phase 7 — Real content (part 1, 2026-11-09)

- Source: Mohamed's CVs (AI Engineer, IoT, Java). Nothing invented: facts not in the CVs are left
  empty or noted as hidden `TODO(mohamed)` comments (never visible on the site).
- Decided: public email essamohmed8@gmail.com; no phone on the site (CV PDFs only); Shadia Travel
  included under a new "Web" category (neutral accent).
- Content: bio, roles, hero lines, 5 milestones, 6 experience/education entries, skills (names match
  project stacks: 20 skill → project links in the graph), LinkedIn link, both CV PDFs.
- Projects: Wanas (AI · Embedded · IoT), Arabic ID OCR Pipeline (AI), Shadia Travel (Web), Smart Parking
  & Smart Gate (IoT · Embedded), each with an architecture diagram; illustrated covers (sharp-rendered SVG)
  until real photos arrive. The three placeholder projects, their media and the Reply Twin demo removed.
- Verified: no placeholder text in any built page; no console errors on all pages; Lighthouse (mobile)
  home 89–95, case studies 93–94 (one noisy 76 run: an unattributable browser task), A11y/BP/SEO 100.

## Inputs needed from Mohamed (SPEC §11)

- [x] 3-sentence bio + 4–6 timeline milestones (from the CVs)
- [x] Final project list (from the CVs) — still open: GitHub/live links, Smart Parking's year
- [ ] Media per project (photos/screenshots, hover clip, demo video, `.glb`) — illustrated covers for now
- [x] Both CV PDFs (AI Engineer, Embedded & IoT)
- [x] Contact links: email, GitHub, LinkedIn (no WhatsApp: decided)
- [x] Confirmed skill list (from the CVs)
- [x] Experience and education entries (from the CVs)
- [ ] Portrait photo or avatar decision
- [ ] Custom domain or stay on `*.pages.dev`
- [x] "Ask my AI" widget: no (for now)
- [ ] Arabic RTL later: yes / no
