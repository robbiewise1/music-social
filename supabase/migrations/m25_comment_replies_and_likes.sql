-- M25: Comment replies (one level) + comment likes — run this in the Supabase SQL editor
-- Safe to re-run (uses IF NOT EXISTS)

-- ────────────────────────────────────────────────
-- REPLIES: self-referencing parent_id, one level deep (enforced in app code)
-- ────────────────────────────────────────────────

alter table comments
  add column if not exists parent_id uuid references comments(id) on delete cascade;

alter table album_post_comments
  add column if not exists parent_id uuid references album_post_comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on comments(parent_id);
create index if not exists album_post_comments_parent_id_idx on album_post_comments(parent_id);

-- ────────────────────────────────────────────────
-- LIKES ON COMMENTS
-- ────────────────────────────────────────────────

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

create policy "comment_likes: public read"
  on comment_likes for select using (true);
create policy "comment_likes: insert own"
  on comment_likes for insert with check (auth.uid() = user_id);
create policy "comment_likes: delete own"
  on comment_likes for delete using (auth.uid() = user_id);

create policy "album_comment_likes: public read"
  on album_comment_likes for select using (true);
create policy "album_comment_likes: insert own"
  on album_comment_likes for insert with check (auth.uid() = user_id);
create policy "album_comment_likes: delete own"
  on album_comment_likes for delete using (auth.uid() = user_id);
