-- Rolling batches (the writer fills the next 7 days from any day, not only Mondays).
-- The batch kind check only allowed 'weekly' and 'fast_lane', so submit_batch refused kind 'rolling'.
alter table social_batches drop constraint if exists social_batches_kind_check;
alter table social_batches add constraint social_batches_kind_check check (kind in ('weekly', 'fast_lane', 'rolling'));
