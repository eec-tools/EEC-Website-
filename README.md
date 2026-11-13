# Elan Exports Consultancy (EEC) — Website

Marketing site and buyer/supplier portal for Elan Exports Consultancy, a Singapore
Headquartered sourcing and procurement consultancy connecting global buyers with verified
manufacturers across India and Asia.

## Tech stack

- **Frontend** (`frontend/`): Next.js (App Router). Public pages are statically prerendered at build
  time. Deployed on Vercel. Company identity and contact details live in one file,
  `frontend/src/constants/company.js`; edit it to update the footer, contact page and legal pages.
- **Backend** (`backend/`): Express API, backed by Supabase Postgres (with an in-memory
  fallback for local development). Deployed on Vercel as serverless functions.

## Setup

### Frontend

```bash
cd frontend
yarn install
yarn dev        # dev server at http://localhost:3000
yarn build      # production build (next build)
yarn lint       # eslint src
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

## Public legal pages

`/privacy-policy`, `/terms`, `/data-deletion` and `/contact` are public (no login). `/privacy` redirects to
`/privacy-policy`. The contact form posts to `POST /api/leads`, protected by a honeypot field, a minimum
fill time and a per-IP rate limit.
