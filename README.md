# Mohamed Eissa — Portfolio

**From Silicon to Intelligence.** A static, animated, dark-mode developer portfolio built with
Next.js (static export) and deployed for $0/month on Cloudflare Pages.

- Build spec: [`SPEC.md`](SPEC.md)
- Phase plan and status: [`PLAN.md`](PLAN.md)

## Where to edit content

These are the only places you need to touch to update the site. No component code required.

| What                                       | Where                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| Name, links, email, hero lines, about text | `content/site.ts`                                                        |
| Projects (one file each) + their media     | `content/projects/<slug>.mdx` + `public/projects/<slug>/`                |
| CV PDFs                                    | `public/cv/mohamed-eissa-ai.pdf`, `public/cv/mohamed-eissa-embedded.pdf` |

Experience, timeline and education entries live in `content/experience.ts` and `content/timeline.ts`.
UI text (buttons, labels) is in `lib/i18n/en.ts`.

### Adding a project

1. Create `content/projects/<slug>.mdx` (copy an existing one; frontmatter is validated at build time).
2. Put its media in `public/projects/<slug>/` (at least `cover.webp`, 16:10).
3. Run `pnpm build`. The card and the case-study page appear automatically.

### Animations

Motion is declared with data attributes on ordinary markup; `lib/motion/engine.ts` does the rest
(and skips it all when the visitor prefers reduced motion):

| Attribute               | Effect                                           |
| ----------------------- | ------------------------------------------------ |
| `data-reveal="split"`   | Heading lines slide up from a mask               |
| `data-reveal="up"`      | Fade up 16px when scrolled into view             |
| `data-reveal="stagger"` | Direct children fade up one after another        |
| `data-reveal="each"`    | Each direct child reveals on its own (long text) |
| `data-scramble`         | Text resolves from binary noise                  |
| `data-magnetic`         | Button pulls toward the mouse                    |
| `data-cursor="view"`    | Custom cursor shows `VIEW`                       |

## Local development

Requires Node 22+ and pnpm (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # static site → out/
pnpm start        # serve out/ locally
pnpm check        # typecheck + lint + prettier
```

## Deploy (Cloudflare Pages)

Live: **https://mohamed-eissa.pages.dev**. Pushing to `main` deploys production; every other branch gets its own preview URL.

One-time setup in the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**:

| Setting                | Value                                          |
| ---------------------- | ---------------------------------------------- |
| Repository             | `3isa2002/portfolio` (project `mohamed-eissa`) |
| Production branch      | `main`                                         |
| Framework preset       | None                                           |
| Build command          | `pnpm build`                                   |
| Build output directory | `out`                                          |
| Environment variables  | `NODE_VERSION=24`, `PNPM_VERSION=12.11.2`      |

## CI

`.github/workflows/lighthouse.yml` runs on every push and PR: typecheck, lint, Prettier, build, then
Lighthouse CI (mobile) against the budgets in SPEC §8.
