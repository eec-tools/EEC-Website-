-- EEC Social Engine: Outreach (November 2026).
-- The writer finds recent LinkedIn posts from buyers in EEC's markets and drafts a comment for each;
-- the team posts them from the EEC page by hand (Studio > Outreach). Nothing is posted automatically.
-- Run once in Supabase (SQL editor) BEFORE deploying the code that uses it. Safe to run twice.

-- Buyers and companies whose posts we comment on.
create table if not exists social_outreach_targets (
  id                bigserial primary key,
  name              text not null,
  kind              text not null default 'company' check (kind in ('company', 'person')),
  linkedin_url      text not null,
  market            text,                     -- UK, EU, US, Canada, Australia, South Africa, Middle East, Asia-Pacific
  category          text,                     -- which EEC category they buy
  reason            text,                     -- why they are worth knowing
  active            boolean not null default true,
  added_by          text,                     -- 'writer' or a team member's email
  checked_at        timestamptz,              -- when the writer last read their page
  last_post_at      timestamptz,              -- their newest post the writer saw
  last_commented_at timestamptz,              -- when we last posted a comment on one of their posts
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists social_outreach_targets_url_idx on social_outreach_targets(linkedin_url);
create index if not exists social_outreach_targets_active_idx on social_outreach_targets(active, checked_at);

-- One drafted comment per post.
create table if not exists social_outreach_comments (
  id               bigserial primary key,
  target_id        bigint references social_outreach_targets(id) on delete set null,
  target_name      text,
  channel          text not null default 'linkedin',
  post_url         text not null,
  post_posted_at   timestamptz,
  post_excerpt     text,                      -- what the post says, in the writer's words
  post_reactions   integer,
  post_comments    integer,
  why_picked       text,
  comment          text not null,
  angle            text,                      -- tip, question, fact, experience, congrats
  sources          jsonb not null default '[]'::jsonb,   -- [{title, url, date}] for any fact in the comment
  previous         jsonb not null default '[]'::jsonb,   -- earlier versions [{comment, at, by}]
  status           text not null default 'ready' check (status in ('ready', 'rewrite', 'posted', 'skipped', 'expired')),
  rewrite_request  text,
  batch_date       date,
  edited           boolean not null default false,
  posted_at        timestamptz,
  posted_by        text,
  skip_reason      text,
  outcome          text check (outcome in ('none', 'reply', 'conversation', 'enquiry')),
  outcome_note     text,
  outcome_at       timestamptz,
  outcome_by       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create unique index if not exists social_outreach_comments_url_idx on social_outreach_comments(post_url);
create index if not exists social_outreach_comments_status_idx on social_outreach_comments(status, batch_date);

notify pgrst, 'reload schema';
