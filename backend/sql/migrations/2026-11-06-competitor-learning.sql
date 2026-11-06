-- EEC Social Engine: competitor watch and learning decisions (November 2026).
-- Run once in Supabase (SQL editor) BEFORE deploying the code that uses it. Safe to run twice.

-- Competitors are now checked by the writer at its daily run.
alter table social_competitors add column if not exists checked_at timestamptz;
alter table social_competitors add column if not exists check_summary text;
alter table social_competitors add column if not exists updated_by text;
-- Their social pages, read through the Bright Data connector.
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

-- Tell Supabase's API about the new tables and columns straight away.
notify pgrst, 'reload schema';
