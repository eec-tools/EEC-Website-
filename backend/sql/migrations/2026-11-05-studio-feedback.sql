-- EEC Social Engine: Studio feedback (November 2026).
-- Run once in Supabase (SQL editor) BEFORE deploying the code that uses it. Safe to run twice.

-- Posts: LinkedIn document posts, format and audience segment, and the open change request.
alter table social_posts drop constraint if exists social_posts_kind_check;
alter table social_posts add constraint social_posts_kind_check check (kind in ('text', 'image', 'carousel', 'reel', 'document'));
alter table social_posts add column if not exists format text;
alter table social_posts add column if not exists segment text;
alter table social_posts add column if not exists change_request jsonb;

-- Competitors: companies (existing table), people and their best posts.
alter table social_competitors add column if not exists linkedin_url text;
alter table social_competitors add column if not exists added_by text;
alter table social_competitors add column if not exists updated_at timestamptz default now();

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

-- Reminders: one digest at 09:30 and one at 18:30 (Asia/Kolkata), switched on.
insert into social_config (key, value, updated_by)
values ('reminders', '{"enabled": true, "times": ["09:30", "18:30"]}'::jsonb, 'migration 2026-11-05')
on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();

-- When the scheduled task runs (used to tell people when a requested change will be ready).
insert into social_config (key, value, updated_by)
values ('engine_runs', '["08:12","09:12","10:12","11:12","12:12","13:12","14:12","15:12","16:12","17:12","18:12","19:12","20:12"]'::jsonb, 'migration 2026-11-05')
on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
