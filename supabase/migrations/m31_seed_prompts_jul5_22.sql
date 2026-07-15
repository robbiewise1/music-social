-- M31 seed: daily_fun prompts July 5-15, song_of_the_day prompts extended
-- through July 22 (previously seeded only through July 7 in m4).
-- Safe to re-run (ON CONFLICT DO NOTHING).

insert into prompts (title, description, active_date, prompt_type) values
  ('Post a deep cut!', 'A lesser known song from an artist', '2026-07-05', 'daily_fun'),
  ('Post your favourite American song!', 'Happy 4th of July to those who celebrate', '2026-07-06', 'daily_fun'),
  ('Post a song you would love to see live!', 'Any song, any artist, dead or alive', '2026-07-07', 'daily_fun'),
  ('Post a song that got you into a certain artist!', null, '2026-07-08', 'daily_fun'),
  ('Post a song with non-english lyrics!', null, '2026-07-09', 'daily_fun'),
  ('Post a song with a colour in the title!', null, '2026-07-10', 'daily_fun'),
  ('Post a song from the year you were born!', null, '2026-07-11', 'daily_fun'),
  ('Post a song outside your usual genre!', null, '2026-07-12', 'daily_fun'),
  ('Post your favourite album opener!', null, '2026-07-13', 'daily_fun'),
  ('Post a guilty pleasure song!', null, '2026-07-14', 'daily_fun'),
  ('Post your favourite song that came out this year!', null, '2026-07-15', 'daily_fun')
on conflict (active_date, prompt_type) do nothing;

insert into prompts (title, description, active_date, prompt_type) values
  ('Song of the Day', 'What are you listening to today?', '2026-07-08', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-09', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-10', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-11', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-12', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-13', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-14', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-15', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-16', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-17', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-18', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-19', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-20', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-21', 'song_of_the_day'),
  ('Song of the Day', 'What are you listening to today?', '2026-07-22', 'song_of_the_day')
on conflict (active_date, prompt_type) do nothing;
