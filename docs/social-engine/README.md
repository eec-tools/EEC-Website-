# EEC Social Engine ("God Mode")

One loop for LinkedIn (Shirali's profile), Instagram and the Facebook Page:
Claude researches, plans, writes and checks; one approver approves on **www.eectrade.com/studio**;
Buffer publishes at the exact time; the clock syncs results; Claude learns from edits and numbers.
Replaces the n8n LinkedIn approval chain and the one-off n8n Instagram/Facebook publishers.

## How the pieces fit

| Piece | Where | What it does |
| --- | --- | --- |
| Studio page | `frontend/src/app/studio`, `frontend/src/views/studio` | Pending, Plan, Queue, Posted, Insights, Learning, Health and settings. Login with the normal site account. |
| Studio API | `backend/src/routes/studio.js` | Approve, edit, send back, drop, post now, pause, comments, metrics, rules, settings, team. |
| Core rules | `backend/src/social/service.js` | Approval, scheduling, never-post-twice, late window, kill switch, revisions. |
| Rule check | `backend/src/social/rules.js` | House style and brand checks on every post (contractions, dashes, location, scope, hashtags, scores, sources). |
| Publisher | `backend/src/social/buffer.js` | Buffer GraphQL: create (scheduled or now), delete, status, metrics, channels. |
| Clock | `backend/src/social/tick.js`, `.github/workflows/social-clock.yml`, `backend/vercel.json` crons | Every 15 min: sync sent posts, schedule approved, mark missed, remind. Daily: health and metrics. |
| Slides | `backend/src/social/slides.js`, `GET /api/social/media/:post/:version/:n.jpg` | Renders carousel slides (EEC navy and gold, 1080x1350 JPEG) on request; cached forever per version. |
| Claude connector | `backend/src/social/mcp.js`, `POST /api/social/mcp/<SOCIAL_AGENT_KEY>` | MCP tools for the scheduled tasks. Draft and revise only: there is no approve or publish tool. |
| Data | `backend/sql/social_schema.sql`, `backend/sql/social_seed.sql` | Supabase tables `social_*`. Seed carries over the 23 n8n rules, settings and competitors. |
| Prompts | `docs/social-engine/prompts/` | The four Claude scheduled tasks. |

## Roles

`social_members`: exactly one **approver** (plus an optional backup approver), **editors** (edit, send back, pause, settings), **viewers** (view and comment). A site admin who is not a member gets editor access.

## Safety rules (enforced in the backend, not the page)

- Nothing goes to Buffer without the approver's approval; approving one post or batch never approves another.
- Every send is written down before Buffer is called. An unclear answer from Buffer marks the post failed and is never retried automatically, so a post cannot go out twice. A clear refusal is retried by the clock up to 3 times.
- Not approved within `late_window_hours` (6) of its time: marked missed, never sent. Approved late but inside the window: sent immediately.
- Editing an approved post pulls it back from Buffer and needs approval again.
- Kill switch (Health tab): anyone on the team can pause; only the approver can resume. Pausing pulls every queued post from Buffer.
- `dry_run` (on by default): approving does not call Buffer. Turn off at go-live.
- Post text is linted on submit, revision, edit and approval. Errors block approval unless the approver gives a logged reason.

## Environment variables (backend Vercel project)

| Name | Value |
| --- | --- |
| `BUFFER_API_KEY` | Buffer personal API key (publish.buffer.com/settings/api) |
| `SOCIAL_AGENT_KEY` | 32+ random characters. Connector URL is `https://eec-website-backend.vercel.app/api/social/mcp/<this>` |
| `CRON_SECRET` | 32+ random characters. Same value as the GitHub repository secret `CRON_SECRET` |
| `SOCIAL_PUBLIC_BASE_URL` | `https://eec-website-backend.vercel.app` |

Generate secrets with `openssl rand -hex 32`. SMTP, Supabase and JWT variables are already set for the site.

## Develop and test

```bash
cd backend && npm install
JWT_SECRET=t node --test tests/social_engine.test.js        # 12 end-to-end tests, in memory
JWT_SECRET=dev node scripts/studio-demo.js                   # demo API with sample posts on :8000
cd ../frontend && NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 yarn dev
# http://localhost:3000/login  demo@eectrade.com / Demo-Pass-123!  then /studio
```

After changing `src/social/seedData.js`, run `node scripts/social-build-seed.js` to regenerate `sql/social_seed.sql`.

## Not built yet (next phases)

- Inbox of platform comments and DMs with drafted replies (table `social_inbox` exists; needs a Meta token or Buffer engagement API).
- Website leads tagged with the UTM source of the post that brought them.
- Reels generation (a reel can be posted today by putting a public .mp4 URL in the post's media).
- EEC LinkedIn company page (cadence is off until Buffer has the page connected).
