# My Blueprint

Patient portal for Blueprint Integrative Mental Health — the front-facing
half of BlueprintOS.

## This is a sandbox

Nothing here connects to a backend. Every screen reads demo data from
`src/data/fixtures.ts` through `src/data/api.ts`, and that one file is the
seam: when the practice moves off Tebra onto its own records, the function
bodies in `api.ts` change and the screens do not.

Two rules hold that line, and both are checked before release:

- no screen or component imports `fixtures.ts`
- nothing outside `src/data/api.ts` calls `fetch`, a WebSocket, or Convex

`src/data/auth.ts` is a demo gate, not security — it compares a string in
the browser, so the demo password is readable in the bundle. Delete that
file when real patient authentication arrives; keep only the shape of
`signIn` / `signOut`.

## Running it

```
npm install
npm run dev     # http://localhost:5174
```

## Design

Mobile primary, with a second layout at 900px. The shell is the brand navy
and content floats on it as rounded panels. Panel tints carry meaning
rather than decoration — pale blue is a visit, sand is what's waiting on
you, mint is nothing to do.

Colours that have to work on both the navy and a panel are surface-stepped
variables (`--p-muted`, `--p-link`, `--p-ok`, `--p-warn`, …) declared once
per surface in `src/theme/portal.css`. Don't hardcode them: `brand-900` is
only 3.5:1 on the navy, and the status colours are tuned for the OS canvas
rather than these tints.

Every route is held to WCAG 2.1 AA, every touch target to 44px, and the
crisis affordance is on every screen including sign-in.

## Deploys

Pushes to `main` build on Netlify and publish to
`my-blueprint-portal.netlify.app`, which is password-protected and
noindexed. `netlify.toml` carries the CSP and security headers.

<!-- ci: builds on push to main -->
