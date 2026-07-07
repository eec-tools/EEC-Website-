# Emergent.sh Platform Dependency Audit

Read-only audit. No code was modified. Scope: full repo excluding `node_modules`, `.git`, `build`, `dist`.

---

## 1. ENV VARS & SECRETS

| Variable | File | Line | Notes |
|---|---|---|---|
| `EMERGENT_LLM_KEY` | `backend/.env.example` | 20 | Declared as a placeholder env var in the example file. |
| `EMERGENT_LLM_KEY` | `backend/server.py` | 32 | `EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")` — read into a module-level variable but **never referenced again anywhere else in `server.py`** (confirmed via grep — only this one hit). Dead/unused; no LLM calls exist in the backend at all. |
| `EMERGENT_AUTH_SESSION_URL` | `backend/server.py` | 36 | Hardcoded (not env-driven) constant: `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data`. This is Emergent's managed OAuth session-exchange endpoint, called directly by the backend. |

No other env files exist besides the two `.env.example` files (`frontend/.env.example`, `backend/.env.example`). No real `.env` file is present in the repo (correctly gitignored). No other var names containing "emergent", "proxy", or "universal key" were found in either example file or in code (`REACT_APP_BACKEND_URL`, `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `AWS_*`, `SMTP_*` are all generic/provider-agnostic).

---

## 2. DATABASE

- **Driver:** `motor` (async MongoDB driver) + `pymongo`, wired in `backend/server.py:24,285-291`.
- **Connection config:**
  ```python
  MONGO_URL = os.environ["MONGO_URL"]   # server.py:28
  DB_NAME   = os.environ["DB_NAME"]     # server.py:29
  client = AsyncIOMotorClient(MONGO_URL, ...)  # server.py:285
  db = client[DB_NAME]                  # server.py:291
  ```
- **Emergent-managed host? NO** (as configured). `MONGO_URL`/`DB_NAME` are read from plain environment variables with no default value and no hardcoded Emergent/managed hostname anywhere in code. The actual connection target depends entirely on whatever `MONGO_URL` is set to in the deployment environment — this audit cannot see that value (no real `.env` in the repo), but nothing in the codebase hardwires it to an Emergent-managed database. This is architecturally independent/portable as written.
- **Collections in use** (grep `db\.[a-zA-Z_]+` in `backend/server.py`):
  - `db.users`
  - `db.user_sessions`
  - `db.supplier_applications`
  - `db.buyer_intakes`
  - `db.files`
  - `db.leads`
  - `db.password_reset_tokens`

---

## 3. AUTH

Two parallel auth mechanisms coexist in `backend/server.py`:

1. **JWT email/password auth** (independent, not Emergent-coupled):
   - `JWT_SECRET = os.environ["JWT_SECRET"]` (line 30), `HS256`.
   - Access/refresh token cookies set in `set_auth_cookies` (~line 340).
   - Standard bcrypt password hashing, `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/me` routes.

2. **Emergent-managed Google OAuth** (Emergent-coupled):
   - `frontend/src/pages/Login.jsx:39` and `frontend/src/pages/Register.jsx:41` both redirect the browser to:
     ```
     https://auth.emergentagent.com/?redirect=<origin>/buyer
     ```
     This is Emergent's hosted OAuth entry point — the app does not own a Google OAuth client ID/secret itself; Emergent's proxy handles the Google consent flow.
   - Both files carry an explicit guard comment: `// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH` (`Login.jsx:38`, `Register.jsx:40`, and again server-side at `server.py:764`).
   - After redirect, the frontend receives a `session_id` and the backend exchanges it for user identity by calling Emergent's session-data endpoint:
     ```python
     # server.py:36
     EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
     # server.py:766-776, inside POST /auth/google/session
     resp = requests.get(EMERGENT_AUTH_SESSION_URL, headers={"X-Session-ID": payload.session_id}, timeout=15)
     ```
     Emergent returns `email`, `name`, `picture`, and a `session_token`, which the backend then stores in `db.user_sessions` and treats as an authenticated session (see `get_current_user`, `server.py:353-384`, which checks `session_token` cookie against `db.user_sessions` as a fallback to JWT).
   - **Flag: this is a hard dependency on Emergent's managed OAuth infrastructure.** There is no independent Google OAuth client ID/secret anywhere in the codebase — the entire "Sign in with Google" feature is proxied through `auth.emergentagent.com` / `demobackend.emergentagent.com`. If Emergent's auth service is unavailable or decommissioned, Google login breaks entirely (email/password JWT login is unaffected).

---

## 4. AI/LLM INTEGRATION

- **No active LLM calls exist anywhere in the codebase.** Grep for `openai`, `anthropic`, `litellm`, `chatcompletion`, `emergentintegrations` across `backend/*.py` and `requirements.txt` returns only:
  - `backend/server.py:32` — the unused `EMERGENT_LLM_KEY` env var read (see Section 1; never consumed).
  - `backend/requirements.txt:28` — `# emergentintegrations==0.2.0  # commented out for local setup; provide package or index to enable` — the Emergent LLM SDK package is present only as a **commented-out** line, not installed.
- **Conclusion:** LLM integration is currently a stub/placeholder. If it were enabled by uncommenting `emergentintegrations` and using `EMERGENT_LLM_KEY`, it would route through Emergent's universal-key proxy rather than a direct provider API key the user owns — but as shipped, no such call path is wired up.

---

## 5. DEPLOYMENT & INFRA

- **No Kubernetes, Docker, GCP/AWS infra-as-code, or `.emergent` folder found in the repo.** (`find` for `Dockerfile*`, `docker-compose*`, `*.tf`, `k8s*`, `.emergent*` returned nothing.)
- `.gitignore:7` contains an entry `.emergent/` — meaning a `.emergent` platform folder is expected/generated locally by the Emergent tool but is not committed and not present in this checkout.
- **`frontend/vercel.json`** (Vercel deployment config) — CSP header allowlists Emergent domains:
  - Line 25: `script-src` allows `https://assets.emergent.sh`; `connect-src` allows `https://*.emergentagent.com`.
  - This is the only deployment/infra config file in the repo, and it explicitly carves out CSP exceptions for Emergent's asset CDN and auth/agent API domains — meaning the production CSP is coupled to Emergent staying reachable for the visual-edits script and the OAuth flow to function without being blocked by the browser.
- No CI config (`.github/workflows` or similar) exists in the repo at all.
- `backend/tests/test_elan_backend.py:13` — test suite falls back to an Emergent preview URL if `REACT_APP_BACKEND_URL` isn't set: `https://elan-exports-v2.preview.emergentagent.com` — this is an Emergent-hosted preview/staging deployment URL used only as a test default.

---

## 6. PACKAGE DEPENDENCIES

| Package | File | Line | Type |
|---|---|---|---|
| `@emergentbase/visual-edits` | `frontend/package.json` | 83 | `devDependencies` — installed via a direct tarball URL `https://assets.emergent.sh/npm/emergentbase-visual-edits-1.0.12.tgz` (not the public npm registry). Dev-only; used by `craco.config.js` to enable an in-browser visual-editing overlay during local dev. |
| `@emergentbase/visual-edits` | `frontend/package-lock.json` | 71, 2513, 2515 | Lockfile entries mirroring the above. |
| `emergentintegrations` | `backend/requirements.txt` | 28 | Commented out, not installed. |

No other package in `frontend/package.json`, `frontend/package-lock.json`, or `backend/requirements.txt` contains "emergent" in its name.

**Runtime code coupling:** `frontend/craco.config.js:87-94` conditionally `require()`s `@emergentbase/visual-edits/craco` only when running the dev server (`isDevServer`), wrapped in a try/catch that gracefully degrades ("visual editing disabled") if the package is absent. This does not affect production builds.

---

## 7. DOMAIN & DNS

All hardcoded Emergent domains found in the codebase (deduplicated):

| Domain/URL | File | Line | Purpose |
|---|---|---|---|
| `https://assets.emergent.sh/scripts/emergent-main.js` | `frontend/public/index.html` | 121 | Script tag loaded on every page — Emergent's platform runtime script (likely powers the visual-edits overlay / platform telemetry in the deployed app). |
| `https://assets.emergent.sh` (CDN, general) | `frontend/vercel.json` | 25 | CSP `script-src` allowlist entry. |
| `https://assets.emergent.sh/npm/emergentbase-visual-edits-1.0.12.tgz` | `frontend/package.json`, `package-lock.json` | 83 / 71, 2515 | Package tarball source. |
| `https://auth.emergentagent.com` | `frontend/src/pages/Login.jsx`, `Register.jsx` | 39 / 41 | Google OAuth entry redirect. |
| `https://*.emergentagent.com` (wildcard) | `frontend/vercel.json` | 25 | CSP `connect-src` allowlist entry. |
| `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` | `backend/server.py` | 36 | OAuth session-data exchange endpoint. |
| `https://elan-exports-v2.preview.emergentagent.com` | `backend/tests/test_elan_backend.py` | 13 | Test-only fallback preview/staging URL. |

Additional non-functional textual mentions (no runtime coupling):
- `.gitignore:7` — `.emergent/` folder ignore rule.
- `memory/PRD.md:12,13,17,28,34` — product-requirements documentation describing Emergent Google OAuth and "Emergent managed Object Storage" as part of the original design (note: the actual implemented storage in `server.py` is AWS S3 via `boto3`, not Emergent Object Storage — the PRD text appears to predate or describe an earlier/aspirational design; current code does not call any Emergent storage API).
- `frontend/src/constants/testIds/home.js:5` — a test ID string literal `'home-emergent-link'` (naming artifact only, not a functional dependency).
- `frontend/src/constants/testIds/auth.js:12` — comment referencing an internal lint rule name `emergent(kebab-case-testid)` (tooling/lint convention naming, not a runtime dependency).

---

## 8. SUMMARY TABLE

| Dependency | File(s) | Coupled to Emergent? (Y/N) | Migration Effort (Low/Med/High) | Data Loss Risk (Y/N) |
|---|---|---|---|---|
| Google OAuth login flow (`auth.emergentagent.com` redirect + session exchange) | `frontend/src/pages/Login.jsx:39`, `Register.jsx:41`, `backend/server.py:36,764-798` | **Y** | **High** — requires standing up an independent OAuth client (Google Cloud Console credentials), rewriting the redirect + callback + session-exchange logic, and migrating/re-validating existing `user_sessions` records | Y — active Google-authenticated user sessions in `db.user_sessions` reference Emergent-issued `session_token`s; a cutover would invalidate existing Google-login sessions (email/password users unaffected) |
| `EMERGENT_LLM_KEY` env var (unused) | `backend/server.py:32`, `backend/.env.example:20` | Y (nominal only) | **Low** — it's dead code; can be removed with no functional impact since nothing consumes it | N |
| `emergentintegrations` package (commented out) | `backend/requirements.txt:28` | Y (nominal only) | **Low** — not installed, nothing to migrate | N |
| `@emergentbase/visual-edits` devDependency | `frontend/package.json:83`, `package-lock.json`, `craco.config.js:87-94` | Y | **Low** — dev-only tooling for a visual editor overlay; already fails gracefully if removed; safe to drop for a non-Emergent workflow | N |
| `emergent-main.js` script tag | `frontend/public/index.html:121` | Y | **Low** — a single `<script>` tag; removing it just drops whatever platform runtime/telemetry it provides in production | N |
| CSP allowlist entries for Emergent domains | `frontend/vercel.json:25` | Y | **Low** — just tighten the CSP header once the above script/OAuth dependencies are removed | N |
| MongoDB connection (`MONGO_URL`/`DB_NAME`) | `backend/server.py:28-29,285-291` | **N** (as coded — generic env vars, no hardcoded Emergent host) | N/A | N/A — contingent on what `MONGO_URL` is actually set to in the live deployment, which is outside this repo's visibility |
| JWT email/password auth | `backend/server.py` (register/login/logout/me routes) | N | N/A | N/A |
| AWS S3 object storage | `backend/server.py:38-42,391+` | N | N/A | N/A |
| Test preview URL default | `backend/tests/test_elan_backend.py:13` | Y (test-only) | **Low** — just change the fallback string | N |
| PRD documentation mentions | `memory/PRD.md` | N/A (docs only, describes design intent, not implemented as coupling) | N/A | N/A |

**Overall:** The only functionally load-bearing Emergent dependency in production is the **Google OAuth flow** (auth redirect + session exchange). Everything else is either dead code (`EMERGENT_LLM_KEY`, commented-out `emergentintegrations` package), dev-only tooling (`@emergentbase/visual-edits`), a single external script tag, or CSP/test config that trivially follows once the OAuth flow is addressed. The database, AWS storage, and JWT auth are independent as written.
