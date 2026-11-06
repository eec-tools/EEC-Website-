-- EEC Social Engine ("God Mode") schema.
-- Run once in the Supabase SQL editor (same project as schema.sql), then run social_seed.sql.
-- Every statement is idempotent, so re-running is safe.

-- Settings that the Studio page and the jobs read (cadence, times, reminders, kill switch).
create table if not exists social_config (
  key        text primary key,
  value      jsonb not null,
  notes      text,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- Who can use /studio. Exactly one person should hold the approver role (plus an optional backup).
create table if not exists social_members (
  email      text primary key,
  name       text not null,
  role       text not null check (role in ('approver', 'editor', 'viewer')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- One batch = one week of posts written on Friday (or a fast-lane post written mid-week).
create table if not exists social_batches (
  batch_id     text primary key,
  week_start   date not null,
  kind         text not null default 'weekly' check (kind in ('weekly', 'fast_lane')),
  status       text not null default 'pending'
               check (status in ('pending', 'partly_approved', 'approved', 'closed', 'deleted')),
  plan         jsonb not null default '{}'::jsonb,   -- storyline, audience split, experiment, notes
  experiment   text,
  qa_summary   jsonb not null default '{}'::jsonb,   -- checker findings and its one lesson
  created_by   text not null default 'claude',
  approved_by  text,
  approved_at  timestamptz,
  deleted_copy jsonb,                                -- full copy kept when a batch is deleted
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists social_batches_week_idx on social_batches(week_start desc);

-- One row per post per channel per time.
create table if not exists social_posts (
  post_id          text primary key,
  batch_id         text not null references social_batches(batch_id) on delete cascade,
  channel          text not null check (channel in ('linkedin_shirali', 'linkedin_company', 'instagram', 'facebook')),
  slot_at          timestamptz not null,               -- publish time (UTC)
  kind             text not null check (kind in ('text', 'image', 'carousel', 'reel', 'document')),
  format           text,                               -- one of the 10 rotation formats
  segment          text,                               -- the reader the post is written for
  change_request   jsonb,                              -- open "Request a change" (note, state, ready_by)
  audience         text,                               -- buyer | supplier | both
  market           text,
  pillar           text,
  series           text,
  topic            text not null,
  idea_key         text,                               -- normalised idea, for the never-repeat list
  hook             text,
  body             text not null,                      -- the full caption / post text
  link             text,
  first_comment    text,
  slides           jsonb not null default '[]'::jsonb, -- structured slide data the renderer turns into images
  media            jsonb not null default '[]'::jsonb, -- public image or video URLs, in order
  alt              jsonb not null default '[]'::jsonb, -- alt text per image
  sources          jsonb not null default '[]'::jsonb, -- [{title,url,date,claim}]
  claims           jsonb not null default '[]'::jsonb, -- [{text,source,date}]
  verify_flags     text,
  scores           jsonb not null default '{}'::jsonb, -- checker scores
  lint             jsonb not null default '[]'::jsonb, -- server-side rule check results
  tests            text,                               -- experiment this post tests
  status           text not null default 'pending'
                   check (status in ('pending', 'changes_requested', 'approved', 'scheduled', 'posting',
                                     'posted', 'missed', 'failed', 'dropped')),
  version          integer not null default 1,
  approved_by      text,
  approved_at      timestamptz,
  buffer_id        text,
  external_url     text,
  posted_at        timestamptz,
  error            text,
  tries            integer not null default 0,
  reminder_count   integer not null default 0,
  last_reminder_at timestamptz,
  metrics          jsonb not null default '{}'::jsonb, -- latest numbers (see social_metrics for history)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists social_posts_batch_idx on social_posts(batch_id);
create index if not exists social_posts_slot_idx on social_posts(slot_at);
create index if not exists social_posts_status_idx on social_posts(status);
-- One live post per channel per time slot: prevents double booking.
create unique index if not exists social_posts_one_per_slot
  on social_posts(channel, slot_at)
  where status not in ('dropped', 'missed', 'failed');
-- A Buffer post can belong to one row only: never post twice.
create unique index if not exists social_posts_buffer_id_uq on social_posts(buffer_id) where buffer_id is not null;

-- Every version of every post: what the writer produced and what the approver changed (learning material).
create table if not exists social_post_versions (
  id           bigserial primary key,
  post_id      text not null references social_posts(post_id) on delete cascade,
  version      integer not null,
  body         text not null,
  slides       jsonb not null default '[]'::jsonb,
  change_kind  text not null check (change_kind in ('created', 'approver_edit', 'revision')),
  changed_by   text not null,
  note         text,
  processed_at timestamptz,          -- set when the learning task has read it
  created_at   timestamptz not null default now()
);
create index if not exists social_post_versions_post_idx on social_post_versions(post_id, version);

-- Team comments and change requests on posts.
create table if not exists social_comments (
  comment_id   text primary key,
  post_id      text references social_posts(post_id) on delete cascade,
  batch_id     text references social_batches(batch_id) on delete cascade,
  author_email text not null,
  author_name  text,
  kind         text not null default 'comment' check (kind in ('comment', 'change_request')),
  body         text not null,
  resolved     boolean not null default false,
  processed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists social_comments_post_idx on social_comments(post_id);

-- Writing rules learned from approvers (migrated from n8n li_preferences).
create table if not exists social_preferences (
  id             bigserial primary key,
  approver       text not null default 'all',
  channel        text not null default 'all',
  rule_type      text not null,
  rule_text      text not null,
  status         text not null default 'candidate' check (status in ('active', 'candidate', 'retired')),
  evidence_count integer not null default 1,
  example        text,
  source         text,
  updated_at     timestamptz not null default now()
);

-- Research findings, one row each, with evidence.
create table if not exists social_research (
  id          bigserial primary key,
  found_at    timestamptz not null default now(),
  audience    text,
  market      text,
  category    text,
  finding     text not null,
  evidence    text,
  source_url  text,
  source_date date,
  why         text,
  used_in     text
);
create index if not exists social_research_found_idx on social_research(found_at desc);

-- Experiments, results, standing-rule changes and a dated log.
create table if not exists social_learning (
  id         bigserial primary key,
  kind       text not null check (kind in ('experiment', 'result', 'rule', 'log')),
  title      text not null,
  detail     text,
  measure    text,
  evidence   text,
  status     text not null default 'open' check (status in ('open', 'done', 'dropped', 'active', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Metric snapshots per post.
create table if not exists social_metrics (
  id          bigserial primary key,
  post_id     text not null references social_posts(post_id) on delete cascade,
  captured_at timestamptz not null default now(),
  source      text not null check (source in ('buffer', 'meta', 'manual')),
  metrics     jsonb not null
);
create index if not exists social_metrics_post_idx on social_metrics(post_id, captured_at desc);

-- Comments and messages from the platforms, with a drafted reply. A person always sends.
create table if not exists social_inbox (
  id           bigserial primary key,
  channel      text not null,
  external_id  text not null unique,
  post_id      text references social_posts(post_id) on delete set null,
  author       text,
  body         text not null,
  permalink    text,
  received_at  timestamptz not null default now(),
  kind         text not null default 'general' check (kind in ('buyer_enquiry', 'supplier_application', 'general', 'spam')),
  draft_reply  text,
  status       text not null default 'new' check (status in ('new', 'replied', 'ignored', 'lead_created')),
  handled_by   text,
  handled_at   timestamptz
);

create table if not exists social_competitors (
  name     text primary key,
  url      text,
  category text,
  focus    text,
  active   boolean not null default true,
  notes    text
);

-- Who did what, when. Never edited.
create table if not exists social_audit (
  id     bigserial primary key,
  at     timestamptz not null default now(),
  actor  text not null,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists social_audit_at_idx on social_audit(at desc);

-- Added November 2026 (also in migrations/2026-11-05-studio-feedback.sql for existing databases).
-- Competitors: companies (existing table), people and their best posts.
alter table social_competitors add column if not exists linkedin_url text;
alter table social_competitors add column if not exists added_by text;
alter table social_competitors add column if not exists updated_at timestamptz default now();
alter table social_competitors add column if not exists created_at timestamptz default now();

create table if not exists social_competitor_people (
  id           bigserial primary key,
  name         text not null,
  role         text,
  company      text,
  linkedin_url text,
  topics       text,
  notes        text,
  active       boolean not null default true,
  added_by     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists social_competitor_posts (
  id           bigserial primary key,
  url          text,
  author       text not null,
  author_type  text check (author_type in ('company', 'person')),
  posted_on    date,
  format       text,
  hook         text,
  body         text,
  reactions    text,           -- what the team saw: "140 reactions, 22 comments"
  why_it_works text,           -- written by the engine
  noted_at     timestamptz,
  added_by     text,
  created_at   timestamptz not null default now()
);

-- Insights: enquiries and the people who engaged with a post.
create table if not exists social_enquiries (
  id           bigserial primary key,
  received_at  timestamptz not null default now(),
  channel      text,           -- linkedin | instagram | facebook | email | website | other
  keyword      text,
  post_id      text references social_posts(post_id) on delete set null,
  company      text,
  contact_name text,
  country      text,
  audience     text check (audience in ('buyer', 'supplier', 'other')),
  product      text,
  status       text not null default 'new' check (status in ('new', 'qualified', 'quoted', 'won', 'lost')),
  notes        text,
  added_by     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists social_enquiries_post_idx on social_enquiries(post_id);

create table if not exists social_engagers (
  id            bigserial primary key,
  post_id       text not null references social_posts(post_id) on delete cascade,
  name          text not null,
  headline      text,
  action        text,          -- reaction | comment | share | message
  type          text check (type in ('buyer', 'supplier', 'other')),
  role          text,
  seniority     text,
  company       text,
  follow_up     boolean,
  note          text,
  classified_at timestamptz,
  added_by      text,
  created_at    timestamptz not null default now()
);
create index if not exists social_engagers_post_idx on social_engagers(post_id);

-- Competitor watch and learning decisions (2026-11-06).
-- Competitors are now checked by the writer at its daily run.
alter table social_competitors add column if not exists checked_at timestamptz;
alter table social_competitors add column if not exists check_summary text;
alter table social_competitors add column if not exists updated_by text;
alter table social_competitors add column if not exists instagram_url text;
alter table social_competitors add column if not exists facebook_url text;
alter table social_competitor_people add column if not exists checked_at timestamptz;
alter table social_competitor_people add column if not exists check_summary text;
alter table social_competitor_people add column if not exists updated_by text;

-- Posts the writer finds itself (source 'engine') sit next to the ones the team pastes in (source 'team').
alter table social_competitor_posts add column if not exists source text not null default 'team';
alter table social_competitor_posts add column if not exists summary text;
create unique index if not exists social_competitor_posts_url_idx on social_competitor_posts(url) where url is not null;

-- What we learn from competitors, to approve or discard on the Competitors tab.
create table if not exists social_competitor_learnings (
  id            bigserial primary key,
  competitor    text,
  text          text not null,
  domain        text not null default 'business' check (domain in ('social', 'business')),
  channel       text not null default 'all',
  rule_type     text,
  evidence      jsonb not null default '[]'::jsonb,   -- [{title, url, date}]
  status        text not null default 'pending' check (status in ('pending', 'approved', 'discarded')),
  decided_by    text,                                 -- 'writer' or a team member's email
  decision_note text,
  decided_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists social_competitor_learnings_status_idx on social_competitor_learnings(status);

-- Writing rules: social rules (platform mechanics) are decided by the writer; business rules by the team.
alter table social_preferences add column if not exists domain text;
alter table social_preferences add column if not exists decided_by text;
alter table social_preferences add column if not exists decision_note text;
alter table social_preferences add column if not exists decided_at timestamptz;
update social_preferences set domain = case
  when rule_type in ('hook', 'structure', 'length', 'hashtags', 'timing', 'format', 'cta', 'visual', 'topic_more', 'topic_less') then 'social'
  else 'business' end
where domain is null;
alter table social_preferences alter column domain set default 'business';
alter table social_preferences drop constraint if exists social_preferences_domain_check;
alter table social_preferences add constraint social_preferences_domain_check check (domain in ('social', 'business'));
-- Decisions the writer recorded before this update.
update social_preferences set decided_by = 'writer', decided_at = updated_at, decision_note = example
where decided_by is null and example like 'Writer decision%';

