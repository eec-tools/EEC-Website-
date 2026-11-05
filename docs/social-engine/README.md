# EEC Social Engine ("God Mode")

One loop for the EEC LinkedIn company page, Instagram and the Facebook Page:
Claude researches, plans, writes and checks; one approver approves on **www.eectrade.com/studio**;
Buffer publishes at the exact time; the clock syncs results; Claude learns from edits and numbers.
Replaces the n8n LinkedIn approval chain and the one-off n8n Instagram/Facebook publishers.

## How the pieces fit

| Piece | Where | What it does |
| --- | --- | --- |
| Studio page | `frontend/src/app/studio`, `frontend/src/views/studio` | Waiting for approval, Plan, Queue (by day), Posted, Insights (enquiries, results by format, who engaged), Competitors, Learning, Activity (every run and its sources), Health and settings. Login with the normal site account. |
| Request a change | `RequestChange.jsx`, `service.requestChange` | A button on every post (and every queue day) that has not gone out. Only that post waits (or the whole day when the slides change); it is pulled from Buffer, the next scheduled run makes the change, and nothing posts until someone approves the result. Shows when it will be ready and warns when the post's time comes first. Free route only (no API calls). |
| Studio API | `backend/src/routes/studio.js` | Approve, edit, send back, drop, post now, pause, comments, metrics, rules, settings, team. |
| Core rules | `backend/src/social/service.js` | Approval, scheduling, never-post-twice, late window, kill switch, revisions. |
| Rule check | `backend/src/social/rules.js` | House style, brand and platform checks on every post (contractions, dashes, location, scope, hashtags incl. Instagram's 5 cap, hook length, engagement bait, links in body, scores, sources). |
| Platform playbook | `docs/social-engine/platform-playbook.md` | What Instagram (Mosseri), LinkedIn and Meta say they rank, with sources, and where each point is applied. Re-check every 6 months. |
| Publisher | `backend/src/social/buffer.js` | Buffer GraphQL: create (scheduled or now), delete, status, metrics, channels. |
| Clock | `backend/src/social/tick.js`, `.github/workflows/social-clock.yml`, `backend/vercel.json` crons | Every few minutes: sync sent posts, schedule approved, mark missed. Reminder digests at 09:30 and 18:30 IST. Daily: health and metrics. Opening the Studio also checks Buffer. |
| Slides | `backend/src/social/slides.js`, `GET /api/social/media/:post/:version/:n.jpg` | Renders carousel slides (EEC navy and gold, 1080x1350 JPEG) on request; cached forever per version. |
| Claude connector | `backend/src/social/mcp.js`, `POST /api/social/mcp/<SOCIAL_AGENT_KEY>` | MCP tools for the scheduled task. `start_run` and `finish_job` drive the run; `get_context` has lean views per job (`plan`, `revise`, `research`); replies are compact JSON. Draft and revise only: there is no approve or publish tool. |
| Data | `backend/sql/social_schema.sql`, `backend/sql/social_seed.sql` | Supabase tables `social_*`. Seed carries over the 23 n8n rules, settings and competitors. |
| Prompt | `docs/social-engine/prompts/engine.md` | The one Claude scheduled task (4 runs a day). It calls `start_run`, which says which jobs are due (revise, research, plan_week, report), so idle runs cost one call. |

## Agents inside each run

The scheduled task starts separate agents for checks, so the work is never graded by the agent that wrote it:

| Agent | When | Gets only | Returns |
| --- | --- | --- | --- |
| Fact checker | Friday plan (every fact of the week), revisions that change a fact, and the **recheck** job for posts going out in the next 36 hours | The facts as written, their sources, the posting date | confirmed / corrected / unverifiable per fact, with source. Saved on the post (Studio shows "Facts checked"); anything not confirmed is commented on the post and emailed to the approver. An unverifiable fact blocks approval. |
| Quality checker | Friday plan | Guidelines, platform rules, writing rules, tone reference, finished posts | Scores (stop, useful, true, human, ours, clean), findings, one lesson |

Research, revisions, learning and the weekly report are done by the main run itself (cheaper, and one finding shapes the next). On Mondays the research job also scans competitors' public sites.

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
JWT_SECRET=t node --test tests/social_engine.test.js        # 25 end-to-end tests, in memory
JWT_SECRET=dev node scripts/studio-demo.js                   # demo API with sample posts on :8000
cd ../frontend && NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 yarn dev
# http://localhost:3000/login  demo@eectrade.com / Demo-Pass-123!  then /studio
```

After changing `src/social/seedData.js`, run `node scripts/social-build-seed.js` to regenerate `sql/social_seed.sql`.

## Not built yet (next phases)

- Inbox of platform comments and DMs with drafted replies (table `social_inbox` exists; needs a Meta token or Buffer engagement API).
- Website leads tagged with the UTM source of the post that brought them.
- Reels generation (a reel can be posted today by putting a public .mp4 URL in the post's media).
- Shirali's personal LinkedIn (`linkedin_shirali`) is retired: hidden in Studio settings, kept only so the imported 26 Oct post still displays.

## Database changes

New installs: run `backend/sql/social_schema.sql` then `backend/sql/social_seed.sql`.
Existing databases: run each file in `backend/sql/migrations/` once, in date order, before deploying the code that needs it.
