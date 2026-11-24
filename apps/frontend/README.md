Ciel's frontend: a single-page React app built with [Vite](https://vite.dev) and
[TanStack Router](https://tanstack.com/router). It renders entirely in the
browser — there is no server-side rendering.

## Getting Started

```bash
pnpm dev        # dev server on http://localhost:3000
pnpm build      # production build into dist/
pnpm start      # serve the build locally (vite preview)
pnpm test       # vitest
pnpm typecheck  # tsc --noEmit
pnpm storybook  # component workshop on http://localhost:6006
```

Routes live in `routes/`, one file per URL, following TanStack Router's flat
file convention (`settings.security.mfa.tsx` → `/settings/security/mfa`). A
route file wires a URL to a component; the components themselves live under
`components/`.

## Talking to the backend

The browser calls the backend directly at `API_BASE_URL`, including the
WebSocket. The frontend provides **no** API proxy.

That URL is not baked into the bundle: one built image is deployed against any
backend by changing environment variables. The web server writes
`/runtime-config.json` at startup, and `lib/api/base-url.ts` reads it once
before the app renders.

Endpoints that used to be frontend route handlers now live on the backend:

- `GET /api/v1/ogp?url=…` — Open Graph metadata for link previews
- `GET /api/v1/ogp/image?url=…` — proxied preview thumbnails
- `GET /pwa/manifest.json` — the Web App Manifest, carrying the instance's name

The manifest is the one thing the frontend's own web server proxies, because a
manifest has to be same-origin with the document for its `start_url` to stay in
scope. `INTERNAL_API_BASE_URL` is the address it proxies to, and is used for
nothing else.

The favicon is set in the browser by `components/FaviconLink.tsx` from the
server icon in `/server/info`, so changing it in the admin screens updates the
tab immediately.

## Production

`Dockerfile.frontend` builds the bundle with Node and serves it from
`nginx:alpine` — no Node, and no native image libraries, in the runtime image.
The server's configuration is `nginx/frontend/default.conf.template` plus
`nginx/frontend/40-ciel-config.sh`, which generates the runtime config and the
Content-Security-Policy header from the container's environment.
