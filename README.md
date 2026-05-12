# CUNY Journalism Critique Wheel

An interactive classroom app for running critique sessions at CUNY Journalism.
Instructors can enter a roster, randomize presentation order, and spin two wheels
to pick who gives feedback and what kind of feedback they give.

## Tech stack

- SvelteKit 2 + Svelte 5
- Vite
- Vitest + Testing Library
- Storybook

## Local development

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Useful scripts

- `npm run lint` — run ESLint
- `npm run test` — run tests once
- `npm run build` — build for production
- `npm run storybook` — run Storybook locally

## Deployment

GitHub Actions deploys the site to GitHub Pages from `main` using
`.github/workflows/deploy.yml`.
