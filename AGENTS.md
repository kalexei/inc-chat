<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview

This is **inc-chat**, a Next.js 16 chat-based sales agent frontend for RAK free zone services. It is a pure frontend — all `/api/*` calls are proxied to an external Sales Agent backend API that is **not** part of this repository.

### Running the app

- `npm run dev` starts the Next.js dev server on port 3000.
- `npm run build` produces a production build.
- `npm run lint` runs ESLint (pre-existing lint errors exist in the codebase).
- The app will render its UI without a backend, but chat functionality (sessions, messaging) requires setting `SALES_AGENT_API_ORIGIN` to a running backend instance.

### Key caveats

- **No backend in this repo.** The chat input is disabled until a session is created via the backend API. UI-only changes can be tested without it; chat flow changes require a running backend.
- **No `.env` files are committed.** To configure the backend proxy, set `SALES_AGENT_API_ORIGIN=http://<host>:<port>` before starting the dev server. Alternatively, set `NEXT_PUBLIC_API_BASE_URL` for direct browser-to-API calls.
- **AWS Cognito auth is optional.** Omit all `NEXT_PUBLIC_COGNITO_*` env vars to run without authentication. When enabled, unauthenticated users are redirected from `/` to `/signin`. The flow uses OAuth2 Authorization Code + PKCE via Cognito's hosted UI. The callback page at `/auth/callback` exchanges the code for tokens and stores them in `sessionStorage`.
- **Cognito env vars:** `NEXT_PUBLIC_COGNITO_DOMAIN` (e.g. `myapp.auth.eu-north-1.amazoncognito.com`) and `NEXT_PUBLIC_COGNITO_CLIENT_ID`. The redirect URI defaults to `{origin}/auth/callback`. The Cognito domain used by this project may not be reachable from cloud VMs (private/internal DNS).
- **Node.js 22** is the runtime. No `.nvmrc` or `.node-version` file exists; the repo relies on whatever Node is available (v22+ recommended).
- **npm** is the package manager (lockfile: `package-lock.json`).
