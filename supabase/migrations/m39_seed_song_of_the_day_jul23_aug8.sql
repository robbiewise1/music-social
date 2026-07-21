-- M39 seed: song_of_the_day prompts extended through August 8
-- (previously seeded only through July 22 in m31).
-- Safe to re-run (ON CONFLICT DO NOTHING).

insert into prompts (title, description, active_date, prompt_type) values
  ('Song of the Day', 'What are you listening to today?', '2026-07-23', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-24', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-25', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-26', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-27', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-28', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-29', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-30', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-31', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-01', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-02', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-03', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-04', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-05', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-06', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-07', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-08-08', 'song_of_the_day')
on conflict (active_date, prompt_type) do nothing;
