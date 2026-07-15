-- M38: Genre badge — cache iTunes genre on songs, derived top genre on profiles
-- Run this manually in the Supabase SQL editor (no CLI/migration runner in this project)
-- Safe to re-run (IF NOT EXISTS)

alter table songs add column if not exists genre text;
alter table profiles add column if not exists top_genre text;
