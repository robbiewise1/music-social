-- M26: Missing indexes on hot filter columns — run this in the Supabase SQL editor
-- Safe to re-run (uses IF NOT EXISTS)

-- comments/replies: fetchReplies/fetchAlbumReplies filter on these on every
-- thread open; never indexed, and reply volume just grew with M25.
create index if not exists comments_post_id_idx on comments(post_id);
create index if not exists album_post_comments_album_post_id_idx on album_post_comments(album_post_id);

-- feed pages filter on prompt_id on every load (song + album prompt pages)
create index if not exists posts_prompt_id_idx on posts(prompt_id);
create index if not exists album_posts_prompt_id_idx on album_posts(prompt_id);

-- put-on button / leaderboard filter on both of these
create index if not exists put_ons_post_id_idx on put_ons(post_id);
create index if not exists put_ons_user_id_idx on put_ons(user_id);
