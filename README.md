# portfolio-builder (web)

React 19 + Vite 8 (Rolldown) + React Compiler + Tailwind v4. Talks to
`portfolio-builder-api` for auth, profile storage, and the build/publish
pipeline; renders templates from `@pb/templates`.

## Setup

```sh
bun install
cp .env.example .env   # only needed if the API isn't on localhost:3000
bun run dev
```

`@pb/templates` is a `file:../portfolio-builder-templates` dependency for
local development. Switch to a `github:` dependency once that repo is
pushed (see its README) — its `dist/` is committed, so no build step runs
on install.

## Two entries, one isolation guarantee

- `index.html` → `src/main.tsx` — the builder app (gallery, wizard,
  dashboard, settings). Imports only `@pb/templates`'s schema and
  `TEMPLATES` metadata — never a template's component code.
- `preview.html` → `src/preview.tsx` — an isolated iframe entry. The
  **only** file allowed to import `@pb/templates/loaders` (the static
  `{ id: () => import(...) }` map — a dynamic template-literal import
  can't be code-split by Rolldown, hence the generated static map).

This is what keeps template code, and template global CSS, out of the
builder bundle. `src/features/preview/PortfolioPreview.tsx` is the parent
side of the protocol: it embeds `<iframe src="/preview.html?template=…">`
and exchanges `pb:ready`/`pb:data` postMessages with it.

**Verified, not just designed:** a real `vite build` was run and the
output inspected — the builder's `main`/`core` chunks contain zero
template-specific strings, and the aurora template chunk is reachable only
from `preview.html`'s graph. The rendered preview was also loaded in a
real browser with a clean console — see "Real bugs found and fixed" below.

## `resolve.dedupe` — read before touching template dependencies

`vite.config.ts` sets `resolve.dedupe: ["react", "react-dom"]`. This is
load-bearing, not cosmetic: `@pb/templates` is consumed as a `file:`
(symlinked) dependency, and its `dist/aurora/index.js` imports
`react/compiler-runtime` — React 19's own CJS compiler-runtime helper.
Without `dedupe`, Vite resolves that import by realpath-following the
symlink into the **templates repo's own** `node_modules/react`, producing
a second React instance with its own internals singleton. The compiler
runtime's `useMemoCache` then reads a dispatcher that react-dom never set
(it only sets it on the copy it actually renders with) — every compiled
template component throws `Cannot read properties of null (reading
'useMemoCache')` on mount. Confirmed by loading the built preview in a
real browser before and after this fix.

## Real bugs found and fixed during verification

Three bugs surfaced only by actually running the build and loading it in
a browser — none would have been caught by `tsc`/lint alone:

1. Vite lib mode names extracted CSS after the entry file's basename, not
   the configured `fileName()` — the templates build script renames the
   file but must also patch the `import './X.css'` specifier left inside
   the built JS, or the chunk 404s on its own stylesheet.
2. `@types/archiver` 8.x has no default/callable export — use
   `new ZipArchive(options)`, not `archiver('zip', options)`.
3. The `resolve.dedupe` issue above.

## Cache busting

Vite content-hashes every JS/CSS asset, so those are safe to cache
forever. `index.html` is the one file that must never be cached — it's
what maps "the app" onto the current hashed filenames. When something
serves a stale one anyway (a CDN, a proxy, the browser's own HTTP cache),
the user keeps running old code with no symptom except bugs that were
already fixed.

Two halves close that:

1. **Every build is stamped.** `vite.config.ts`'s `buildStamp` plugin puts
   the same id in two places: a `<meta name="pb-build-id">` in
   `index.html`, and `version.json` at the web root.
   `src/lib/version-check.ts` compares them on load, on every return to the
   tab, and every five minutes; a mismatch means the document came out of a
   cache, so it clears Cache Storage / service workers and reloads to a
   one-shot `?pb_v=…` URL. The reload fetches a fresh document, so the two
   sides necessarily agree afterwards — the check can't loop. (In-progress
   wizard content lives in localStorage, so a forced reload doesn't lose
   it.) Set `VITE_BUILD_ID` to pin the stamp to something meaningful, e.g.
   `VITE_BUILD_ID=$(git rev-parse --short HEAD) bun run build`.

2. **One command to force it.** A normal deploy needs nothing extra — the
   new build's own id is what makes open tabs reload. When the files are
   already right but people are still being served an old document, run:

   ```sh
   bun run cachebust                 # re-stamps ./dist
   bun run cachebust --dir /srv/app  # or a deployed web root, in place
   ```

   It rewrites the stamp in `index.html` and `version.json` together, so
   every cached document mismatches and reloads once. Hashed assets are
   deliberately untouched — their filenames are their cache keys.

For any of this to work, the server must not cache `index.html` or
`version.json`. With nginx:

```nginx
location / { try_files $uri $uri/ /index.html; }
location = /index.html { add_header Cache-Control "no-store"; }
location = /version.json { add_header Cache-Control "no-store"; }
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
```

Note what `try_files $uri $uri/` implies for `public/`: anything in there
shadows the client route of the same path. A `public/templates/` folder
made `$uri/` match a real directory for `/templates/aurora`, so a direct
load or refresh of a template page got a 403 from the directory instead
of the app. Don't add a `public/` entry whose name collides with a route
in `src/routes/index.tsx`.

## Structure

```
src/
  main.tsx / preview.tsx    the two entries
  routes/                   route table
  features/
    gallery/    auth/    wizard/    preview/    deploy/    settings/    dashboard/
  components/ui/            small shadcn-style primitives (Button, Input, Card, …)
  lib/                      api.ts, auth-client.ts, draft-store.ts, env.ts, utils.ts
```

`lib/draft-store.ts` (zustand + localStorage) is what makes the
"pick a template while logged out → OAuth round-trip → land back on
/create with that template and any typed-so-far content" flow survive a
full-page redirect — it's not React state, so it's still there after the
page reloads.

## Known gap

Not exercised end-to-end here: the full auth → wizard → deploy flow
against a live API + Postgres (none available in this environment — see
`portfolio-builder-api`'s README). What's verified: the app renders and
routes correctly, the template preview pipeline works in a real browser,
and the whole module graph type-checks and builds cleanly.
