-- M28: Unify comments + album_post_comments into a single `comments` table.
-- Idempotent — safe to re-run if it partially fails.
-- Run this in the Supabase SQL editor (this project applies comment-related
-- schema changes that way, no CLI link).

-- ────────────────────────────────────────────────
-- Pre-flight (informational — read the output before continuing)
-- ────────────────────────────────────────────────
-- select column_name from information_schema.columns where table_name = 'comments';
-- select count(*) from comments where char_length(body) > 150;
-- select count(*) from comments c join album_post_comments a on c.id = a.id;  -- expect 0

-- ────────────────────────────────────────────────
-- Section A: defensively re-establish the M25/M26 baseline (no-ops if already applied)
-- ────────────────────────────────────────────────

alter table comments
  add column if not exists parent_id uuid references comments(id) on delete cascade;

alter table album_post_comments
  add column if not exists parent_id uuid references album_post_comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on comments(parent_id);
create index if not exists album_post_comments_parent_id_idx on album_post_comments(parent_id);
create index if not exists comments_post_id_idx on comments(post_id);
create index if not exists album_post_comments_album_post_id_idx on album_post_comments(album_post_id);

create table if not exists comment_likes (
  user_id    uuid references profiles(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, comment_id)
);

create table if not exists album_comment_likes (
  user_id          uuid references profiles(id) on delete cascade,
  album_comment_id uuid references album_post_comments(id) on delete cascade,
  created_at       timestamptz default now(),
  primary key (user_id, album_comment_id)
);

create index if not exists comment_likes_comment_id_idx on comment_likes(comment_id);
create index if not exists album_comment_likes_comment_id_idx on album_comment_likes(album_comment_id);

alter table comment_likes       enable row level security;
alter table album_comment_likes enable row level security;

drop policy if exists "comment_likes: public read" on comment_likes;
create policy "comment_likes: public read" on comment_likes for select using (true);
drop policy if exists "comment_likes: insert own" on comment_likes;
create policy "comment_likes: insert own" on comment_likes for insert with check (auth.uid() = user_id);
drop policy if exists "comment_likes: delete own" on comment_likes;
create policy "comment_likes: delete own" on comment_likes for delete using (auth.uid() = user_id);

drop policy if exists "album_comment_likes: public read" on album_comment_likes;
create policy "album_comment_likes: public read" on album_comment_likes for select using (true);
drop policy if exists "album_comment_likes: insert own" on album_comment_likes;
create policy "album_comment_likes: insert own" on album_comment_likes for insert with check (auth.uid() = user_id);
drop policy if exists "album_comment_likes: delete own" on album_comment_likes;
create policy "album_comment_likes: delete own" on album_comment_likes for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- Section B: extend `comments` to be the unified target table
-- (metadata-only ALTERs — no table rewrite, safe on a live table)
-- ────────────────────────────────────────────────

alter table comments add column if not exists album_post_id uuid references album_posts(id) on delete cascade;
alter table comments add column if not exists edited_at timestamptz;
alter table comments add column if not exists deleted_at timestamptz;

create index if not exists comments_album_post_id_idx on comments(album_post_id);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'comments_exactly_one_target_chk') then
    alter table comments add constraint comments_exactly_one_target_chk
      check ((post_id is not null and album_post_id is null) or (post_id is null and album_post_id is not null))
      not valid;
  end if;
end $$;

-- ────────────────────────────────────────────────
-- Section C: copy album_post_comments rows into comments, preserving ids
-- (must run before Section D, since comment_likes.comment_id will FK to these)
-- ────────────────────────────────────────────────

insert into comments (id, user_id, post_id, album_post_id, body, created_at, parent_id, edited_at, deleted_at)
select id, user_id, null, album_post_id, body, created_at, parent_id, null, null
from album_post_comments
on conflict (id) do nothing;

-- ────────────────────────────────────────────────
-- Section D: copy album_comment_likes into the unified comment_likes
-- ────────────────────────────────────────────────

insert into comment_likes (user_id, comment_id, created_at)
select user_id, album_comment_id, created_at from album_comment_likes
on conflict (user_id, comment_id) do nothing;

-- ────────────────────────────────────────────────
-- Section E: validate the CHECK constraint now that data is in place
-- ────────────────────────────────────────────────

alter table comments validate constraint comments_exactly_one_target_chk;

-- ────────────────────────────────────────────────
-- Section F: RLS baseline + first-ever UPDATE policy in this app (own-row pattern)
-- ────────────────────────────────────────────────

alter table comments enable row level security;

drop policy if exists "comments: public read" on comments;
create policy "comments: public read" on comments for select using (true);
drop policy if exists "comments: insert own" on comments;
create policy "comments: insert own" on comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments: delete own" on comments;
create policy "comments: delete own" on comments for delete using (auth.uid() = user_id);
drop policy if exists "comments: update own" on comments;
create policy "comments: update own" on comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTE: album_post_comments and album_comment_likes are intentionally left in
-- place as a rollback net. Drop them separately via m29 only after the new
-- app code has run in prod for a few days with no issues.
