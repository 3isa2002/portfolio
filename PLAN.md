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

| #   | Phase                     | Main deliverables                                                                                                                                                                                                                               | Done when                                                                        | Status            |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------- |
| 0   | Setup and deploy pipeline | Next.js + TS strict + Tailwind + tokens + fonts, static export, ESLint/Prettier, GitHub repo, Cloudflare Pages, Lighthouse CI workflow                                                                                                          | Placeholder page live on `*.pages.dev`, every push redeploys                     | ✅ done           |
| 1   | Layout and content model  | Navbar, footer, 6 home sections (static placeholders, real mobile layouts), Velite schema, 3 placeholder projects (AI / Embedded / IoT), grid without effects, case-study pages, `/projects`, 404, CV redirects (`_redirects`), i18n dictionary | Adding a new `.mdx` creates a card + page with no code changes                   | 🔍 in review (PR) |
| 2   | Motion foundation         | `useReducedMotion`, Lenis ↔ GSAP ticker, SplitText reveals, scroll progress bar, custom cursor, magnetic buttons, About timeline scrub (pinned on desktop)                                                                                      | Every section animates in; with reduced motion everything is static and readable | ☐                 |
| 3   | 3D background             | R3F particle network (1,500 desktop / 400 mobile), circuit ↔ neural morph on scroll, cursor reaction, bloom, `PerformanceMonitor` downgrade, static fallback                                                                                    | 60 fps on a mid laptop; Lighthouse mobile Perf still ≥ 90                        | ☐                 |
| 4   | Boot intro                | Full 3.2 s storyboard (SPEC §4), skip button + any input skips, first-visit `localStorage`, 600 ms return version, handoff into the 3D scene                                                                                                    | ≤ 3.2 s, skippable any moment, never shows twice in a row                        | ☐                 |
| 5   | Projects experience       | Card tilt + sheen + glow, hover preview video, animated filter (`?c=`), shared-element card → case study, `Architecture`, `Gallery` + lightbox, `Video`, `Board3D`, count-up metrics, next-project card, Reply Twin + IoT dashboard demos       | Case study open/close smooth both ways, incl. browser back                       | ☐                 |
| 6   | Extras and SEO            | `⌘K` palette, terminal contact, Konami egg, optional sound, build-time OG images, sitemap, robots, JSON-LD, Cloudflare Web Analytics. Optional "Ask my AI" only if approved                                                                     | All Lighthouse targets in SPEC §8 pass                                           | ☐                 |
| 7   | Real content and launch   | Replace every `TODO(mohamed)`, compress media, large files → R2, cross-browser + real-device testing, custom domain if bought                                                                                                                   | No placeholders remain; site shared publicly                                     | ☐                 |

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

## Inputs needed from Mohamed (before Phase 7, SPEC §11)

- [ ] 3-sentence bio + 4–6 timeline milestones
- [ ] Final project list (title, summary, category, stack, year, status, links)
- [ ] Media per project (cover, 5–10 s hover loop, screenshots, demo video, `.glb`)
- [ ] Both CV PDFs (AI Engineer, Embedded & IoT)
- [ ] Contact links: email, GitHub, LinkedIn, WhatsApp (optional)
- [ ] Confirmed skill list
- [ ] Experience and education entries
- [ ] Portrait photo or avatar decision
- [ ] Custom domain or stay on `*.pages.dev`
- [ ] "Ask my AI" widget: yes / no
- [ ] Arabic RTL later: yes / no
