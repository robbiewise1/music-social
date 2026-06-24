-- M3: Full schema — run this in the Supabase SQL editor
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING)

-- ────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────

create table if not exists follows (
  follower_id  uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists songs (
  id             uuid primary key default gen_random_uuid(),
  spotify_id     text unique not null,
  title          text not null,
  artist         text not null,
  album          text,
  album_art_url  text,
  spotify_url    text,
  preview_url    text,
  created_at     timestamptz default now()
);

create table if not exists prompts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  active_date date unique not null,
  created_at  timestamptz default now()
);

create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  song_id     uuid not null references songs(id) on delete cascade,
  prompt_id   uuid references prompts(id) on delete set null,
  caption     text,
  created_at  timestamptz default now()
);

create table if not exists likes (
  user_id    uuid references profiles(id) on delete cascade,
  post_id    uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- ────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────

create index if not exists posts_user_id_idx      on posts(user_id);
create index if not exists posts_created_at_idx   on posts(created_at desc);
create index if not exists follows_following_idx  on follows(following_id);
create index if not exists likes_post_id_idx      on likes(post_id);

-- ────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────

alter table follows enable row level security;
alter table songs   enable row level security;
alter table prompts enable row level security;
alter table posts   enable row level security;
alter table likes   enable row level security;

-- follows
create policy "follows: public read"
  on follows for select using (true);

create policy "follows: insert own"
  on follows for insert
  with check (auth.uid() = follower_id);

create policy "follows: delete own"
  on follows for delete
  using (auth.uid() = follower_id);

-- songs (shared cache — any authed user can upsert)
create policy "songs: public read"
  on songs for select using (true);

create policy "songs: authed insert"
  on songs for insert
  with check (auth.role() = 'authenticated');

-- prompts (read-only for users; written by service role only)
create policy "prompts: public read"
  on prompts for select using (true);

-- posts
create policy "posts: public read"
  on posts for select using (true);

create policy "posts: insert own"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "posts: delete own"
  on posts for delete
  using (auth.uid() = user_id);

-- likes
create policy "likes: public read"
  on likes for select using (true);

create policy "likes: insert own"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "likes: delete own"
  on likes for delete
  using (auth.uid() = user_id);

-- ────────────────────────────────────────────────
-- SEED PROMPTS
-- ────────────────────────────────────────────────

insert into prompts (title, description, active_date) values
  ('Songs that feel like summer',       'Sun, heat, nostalgia — the whole thing.',              '2026-06-24'),
  ('A song that got you through something hard', 'The one you kept returning to.',             '2026-06-25'),
  ('Songs you''d play at 2am',          'Late night, low light.',                               '2026-06-26'),
  ('A song that makes you want to dance', 'No context needed.',                                 '2026-06-27'),
  ('Songs from a film or TV show',      'Needle drops, scores, anything cinematic.',            '2026-06-28'),
  ('A song you discovered this year',   'Something new that stuck.',                            '2026-06-29'),
  ('Songs that feel like a road trip',  'Windows down, miles ahead.',                           '2026-06-30')
on conflict (active_date) do nothing;
