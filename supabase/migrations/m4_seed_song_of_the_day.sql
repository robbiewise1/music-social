-- M4 seed: song_of_the_day prompts for test date range
-- Safe to re-run (ON CONFLICT DO NOTHING)

insert into prompts (title, description, active_date, prompt_type) values
  ('Song of the Day', 'What are you listening to today?', '2026-06-24', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-06-25', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-06-26', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-06-27', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-06-28', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-06-29', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-06-30', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-01', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-02', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-03', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-04', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-05', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-06', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-07', 'song_of_the_day')
on conflict (active_date, prompt_type) do nothing;
