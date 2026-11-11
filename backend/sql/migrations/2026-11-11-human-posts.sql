-- EEC Social Engine: human posts (November 2026).
-- Photos the writer generates for posts are stored here once, so a post never depends on an outside link.
-- The writer now runs three times a day (10:00, 12:00, 14:00 IST).
-- Run once in Supabase (SQL editor) BEFORE deploying the code that uses it. Safe to run twice.

create table if not exists social_photos (
  id          text primary key,           -- sha1 of the source link (first 20 hex characters)
  source_url  text,
  data        text not null,              -- JPEG, base64, at most 1200px wide
  width       integer,
  height      integer,
  added_by    text,
  created_at  timestamptz not null default now()
);

-- When change requests will be ready is worked out from these run times.
insert into social_config (key, value, updated_by, updated_at)
values ('engine_runs', '["10:00","12:00","14:00"]'::jsonb, 'migration', now())
on conflict (key) do update set value = excluded.value, updated_by = 'migration', updated_at = now();

notify pgrst, 'reload schema';
