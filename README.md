# Elan Exports Consultancy (EEC) — Website

Marketing site and buyer/supplier portal for Elan Exports Consultancy, a Singapore
Headquartered sourcing and procurement consultancy connecting global buyers with verified
manufacturers across India and Asia.

## Tech stack

- **Frontend** (`frontend/`): Create React App, prerendered at build time with `react-snap`
  for the 6 public marketing routes (see below). Deployed on Vercel.
- **Backend** (`backend/`): Express API, backed by Supabase Postgres (with an in-memory
  fallback for local development). Deployed on Vercel as serverless functions.

## Setup

### Frontend

```bash
cd frontend
yarn install
yarn start      # dev server at http://localhost:3000
yarn build      # production build -> frontend/build/ (runs react-snap afterward, see below)
yarn test       # craco test
```

### Backend

```bash
cd backend
npm install
npm start        # node server.js, http://localhost:8000
npm run dev      # same, with --watch for auto-restart
npm test         # node --test tests/*.test.js (requires the server already running)
```

Both apps read config from a local `.env` file in their own directory (`frontend/.env`,
`backend/.env`) — see `backend/.env.example` for every variable the backend expects
(database, JWT, Google OAuth, AWS S3, SMTP).

## Prerendering (react-snap)

The frontend is a client-rendered React app, which normally means crawlers and social-media
link previews see an empty HTML shell until JavaScript runs. To fix that for the pages that
actually need to be indexed, `frontend/package.json`'s `postbuild` script runs `react-snap`
after every `yarn build`: it renders each configured route in headless Chrome and writes the
fully-rendered HTML back into `frontend/build/`, so search engines and AI crawlers get real
content on first load.

**Only these 6 routes are prerendered** (configured under `"reactSnap"` in
`frontend/package.json`):

```
/, /about, /services, /categories, /for-buyers, /for-suppliers
```

Auth-gated routes (`/login`, `/buyer`, `/supplier`, `/admin`, etc.) are deliberately excluded
— they have no public content to index and prerendering them would either fail (they require
a logged-in session) or leak nothing useful.

**If you add a new public marketing page, add its path to the `reactSnap.include` array in
`frontend/package.json`** — otherwise it will silently ship as an empty shell to crawlers,
exactly like the auth-gated routes, but with no good reason for it.

`frontend/vercel.json` also has route-specific rewrites for these same 6 pages so Vercel
serves the prerendered HTML file for each one rather than falling back to the SPA shell —
if you rename or add a prerendered route, that file needs the matching rewrite too.
