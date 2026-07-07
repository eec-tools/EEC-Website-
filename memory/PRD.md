# Elan Exports Consultancy (elan-exports-v2) — PRD

## Original Problem Statement
Build a full-stack B2B website for 'Elan Exports Consultancy' with slug 'elan-exports-v2'.
Pages: Home, For Buyers, For Suppliers, About EEC, Services, Categories.
Homepage: hero with dark overlay & headline "Cut sourcing risk, landed cost, and supplier uncertainty across your India & Asia supply chain.", dual CTAs (Book Sourcing Call & Apply to Network), trust bar, 6 category cards, 4-step buyer process, 3 pricing tier cards.
Dynamic Buyer Portal — multi-step intake form, dashboard.
Dynamic Supplier Onboarding — application with IEC/GST/certifications upload.
Style: premium international trade aesthetic — dark cinematic, gold/amber accents, premium typography.

## User Choices
- Authentication: Both JWT email/password **and** Emergent Google OAuth
- Document Storage: Emergent managed Object Storage
- Email/Payments: deferred (DB capture only; pricing tiers are contact-based)

## Architecture
- Backend: FastAPI + Motor (MongoDB), JWT (PyJWT), bcrypt, Emergent Object Storage via requests, Emergent OAuth session exchange.
- Frontend: React 19 + React Router 7 + Tailwind + shadcn/ui + axios (withCredentials) + sonner toasts + lucide-react.
- Theme: `#05050A` base, `#0C0C14` surface, `#D4AF37` gold accents. Fonts: Outfit (headings) + Manrope (body).

## User Personas
1. **Procurement Lead / Buyer** — submits sourcing briefs, tracks intakes in Buyer Portal.
2. **Factory / Supplier** — applies to the network, uploads IEC/GST/certifications, tracks application status.
3. **EEC Admin** — oversees applications and intakes (admin role gets full read access).

## Core Requirements (static)
- 6 marketing pages (Home, For Buyers, For Suppliers, About, Services, Categories).
- Auth: JWT (register/login/logout/me) + Emergent Google OAuth.
- Buyer Portal with multi-step intake (4 steps) and dashboard.
- Supplier Portal with multi-step application (4 steps) including document upload.
- Pricing tiers, category data served from `/api/pricing` & `/api/categories`.

## Implemented (Feb 19, 2026)
- Backend: JWT auth, Google OAuth session exchange, Emergent Object Storage upload/download, buyer intake, supplier application, leads, categories, pricing endpoints, admin seeding, MongoDB indexes.
- Frontend: All 6 marketing pages with dark-luxury aesthetic, hero with CTAs, trust bar, 6 category cards, 4-step process, 3 pricing tiers, Login + Register, multi-step Buyer Intake + Buyer Portal dashboard, multi-step Supplier Apply with document upload + Supplier Portal dashboard, Auth callback for Google OAuth, ProtectedRoute, Layout (nav + footer), responsive mobile menu.
- Testing: Backend 16/16 pytest passing, Frontend all Playwright flows passing.

## Prioritized Backlog
- P1: Replace `@app.on_event` with lifespan handlers (deprecation warning only).
- P1: `/api/upload` annotate `doc_type` with `Form(...)` so both query and body work.
- P1: Tighten CORS for production (explicit origins, drop `*`).
- P2: Admin dashboard view of all intakes + applications (admin role).
- P2: Email notifications on intake/application submission (Resend or SendGrid).
- P2: Soft-delete endpoint for uploaded documents.
- P3: Brute-force lockout on /auth/login.
- P3: Stripe/Razorpay payment for "Scout" tier self-serve checkout.

## Test Credentials
See `/app/memory/test_credentials.md`.

## Next Tasks
- Wire admin dashboard.
- Add email notifications.
- Marketing enhancements: case studies / testimonials carousel, blog/insights.
