-- M4: Dual prompt types — song_of_the_day + daily_fun
-- Safe to re-run

-- ────────────────────────────────────────────────
-- prompts: add prompt_type column
-- ────────────────────────────────────────────────

alter table prompts
  add column if not exists prompt_type text
    check (prompt_type in ('song_of_the_day', 'daily_fun'));

-- backfill existing rows (the 7 thematic prompts seeded in m3)
update prompts set prompt_type = 'daily_fun' where prompt_type is null;

alter table prompts alter column prompt_type set not null;

-- replace UNIQUE (active_date) with UNIQUE (active_date, prompt_type)
-- so each date can have one of each type
alter table prompts drop constraint if exists prompts_active_date_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prompts_active_date_prompt_type_key'
  ) then
    alter table prompts
      add constraint prompts_active_date_prompt_type_key
      unique (active_date, prompt_type);
  end if;
end $$;

-- ────────────────────────────────────────────────
-- posts: one post per user per prompt
-- ────────────────────────────────────────────────

-- partial index so free-form posts (prompt_id IS NULL) are unaffected
create unique index if not exists posts_one_per_user_per_prompt
  on posts (user_id, prompt_id)
  where prompt_id is not null;

-- ────────────────────────────────────────────────
-- posts: allow users to update their own posts
-- ────────────────────────────────────────────────

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'posts' and policyname = 'posts: update own'
  ) then
    create policy "posts: update own"
      on posts for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
