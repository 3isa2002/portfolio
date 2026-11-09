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

_(These folders arrive in Phase 1.)_

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

Pushing to `main` deploys production; every other branch gets its own preview URL.

One-time setup in the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**:

| Setting                | Value                                     |
| ---------------------- | ----------------------------------------- |
| Repository             | `3isa2002/portfolio`                      |
| Production branch      | `main`                                    |
| Framework preset       | None                                      |
| Build command          | `pnpm build`                              |
| Build output directory | `out`                                     |
| Environment variables  | `NODE_VERSION=24`, `PNPM_VERSION=12.11.2` |

## CI

`.github/workflows/lighthouse.yml` runs on every push and PR: typecheck, lint, Prettier, build, then
Lighthouse CI (mobile) against the budgets in SPEC §8.
