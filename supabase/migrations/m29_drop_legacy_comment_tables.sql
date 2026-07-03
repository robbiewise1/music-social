-- M29: Drop the legacy album_post_comments / album_comment_likes tables.
--
-- Run this ONLY after m28_unify_comments.sql has been applied, the new app
-- code has been deployed, and you've confirmed comments/replies/edits/
-- deletes work correctly in prod for both song posts and album posts for a
-- few days. This is a deliberate, separate step — not bundled into m28 —
-- so the old tables stay available as a rollback net in the meantime.
--
-- Safe to re-run (IF EXISTS).

drop table if exists album_comment_likes;
drop table if exists album_post_comments;
