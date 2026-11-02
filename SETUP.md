# Local development

The source was cloned from https://github.com/dllCorDe/RandFlow (initial commit `726d4e3`).

Install dependencies with `npm install`, then run `npm run dev` and open http://localhost:8080.

Use `npm run typecheck`, `npm test`, and `npm run build` to check changes. The build currently targets Vercel; it does not publish automatically. When DATABASE_URL is set, the build also runs database migrations.

## Where to make updates

- `src/data/budget.ts`: budget figures and explanatory text, stored in the source.
- `src/data/provinces.ts`: provincial figures, stored in the source.
- `src/data/projects.ts`: selected projects and source descriptions, stored in the source.
- `src/lib/tenders.functions.ts`: server requests to National Treasury eTenders, response parsing, and company-link graph construction.
- `src/components/`: dashboard, tender register, projects, and company-link display.

Budget and project claims have not yet been independently verified. The tender integration loads a sample by default; a province can optionally load all available pages. Incomplete responses are flagged. Awards are not proof of actual payments or completed work. Live tender responses and exact official record links have been checked during development.

## Initial checks

- Dependencies installed; repaired an inconsistent imported lock file.
- Fixed the Vite launcher for Windows and replaced the test glob that silently skipped script tests on this setup.
- Type checking and production build passed on Node 22.13.0.
- The 59 explicitly listed TypeScript tests passed.
- Script tests: 189 passed, 8 failed. Failures depend on files from the original builder that are absent from GitHub: `.grok/app-env.json`, `.grok/skills/og/`, and associated documentation. The `.grok` directory and `AGENTS.md` are excluded by the imported `.gitignore`. The failing first stage prevents `npm test` from reaching its TypeScript stage.

## Relationship explorer

The explorer includes a zoomable company overview, company and buyer visibility controls, award value and tender count ranges, per-supplier award totals, and tender descriptions below the graph. Missing award amounts remain marked as unknown. Active tender links target the official search result; other statuses link to Treasury's exact JSON record because the public portal does not provide a reliable standalone HTML tender page for them.

Production build, type checking, and lint checks on changed components passed. The script-test limitations listed above still apply.

No original builder credentials or private configuration were included in the repository. Those files have not been fabricated.
