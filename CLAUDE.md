@AGENTS.md

# Music Club — Project Context

## What this is

A social music-sharing web app. Users respond to daily prompts ("songs that feel like summer"), follow friends, and see a feed of what friends are listening to. No music streaming — the app links out to Spotify/Apple Music.

**Core loop:** See a daily prompt → search Spotify → post a song with a caption → see what friends posted.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript, Tailwind) |
| Auth + DB | Supabase (Postgres + auth + RLS) |
| Song data | iTunes Search API — no auth required (switched from Spotify; Spotify requires Premium for API access) |
| Deployment | Vercel |

## Environment variables

Fill these in `.env.local` before starting Milestone 2:

```
NEXT_PUBLIC_SUPABASE_URL        # supabase.com → project → Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY   # same page
SUPABASE_SERVICE_ROLE_KEY       # same page (server-only, never expose to client)
SPOTIFY_CLIENT_ID               # developer.spotify.com → your app → Settings
SPOTIFY_CLIENT_SECRET           # same page
```

## Key Next.js 16 differences (read before writing code)

- **`proxy.ts` not `middleware.ts`** — route protection goes in `proxy.ts` at the project root, not `middleware.ts`. The export is `export default async function proxy(req)`.
- **`cookies()` is async** — always `await cookies()` before calling `.get()` / `.set()`.
- **Route handler params** — use `RouteContext<'/path/[param]'>` for typed params in route handlers.
- Full docs are in `node_modules/next/dist/docs/` — read the relevant guide before writing any feature.

## Supabase helpers

| File | Use when |
|---|---|
| `lib/supabase/client.ts` | Inside Client Components (`'use client'`) |
| `lib/supabase/server.ts` | Inside Server Components, Server Actions, Route Handlers |

## Folder structure

```
app/
├── page.tsx                          ← Landing page ✓
├── layout.tsx                        ← Root layout with <Nav /> ✓
├── _components/nav.tsx               ← Auth-aware nav bar (server component) ✓
├── _components/feed-item.tsx         ← Song post feed item ✓
├── _components/like-button.tsx       ← Like button for song posts ✓
├── _components/reply-button.tsx      ← Reply button for song posts ✓
├── _components/song-card.tsx         ← Song display card ✓
├── _components/song-search-input.tsx ← Song search with debounce ✓
├── _components/sortable-feed-list.tsx ← Sort toggle for song feeds ✓
├── _components/album-card.tsx        ← Album display card ✓
├── _components/album-search-input.tsx ← Album search with debounce ✓
├── _components/album-feed-item.tsx   ← Album post feed item ✓
├── _components/album-like-button.tsx ← Like button for album posts ✓
├── _components/album-reply-button.tsx ← Reply button for album posts ✓
├── _components/sortable-album-feed-list.tsx ← Sort toggle for album feeds ✓
├── actions/auth.ts                   ← signup / login / logout server actions ✓
├── actions/posts.ts                  ← createPost for songs ✓
├── actions/likes.ts                  ← toggleLike for song posts ✓
├── actions/replies.ts                ← fetchReplies / addReply for songs ✓
├── actions/album-posts.ts            ← createAlbumPost ✓
├── actions/album-likes.ts            ← toggleAlbumLike ✓
├── actions/album-replies.ts          ← fetchAlbumReplies / addAlbumReply ✓
├── login/page.tsx                    ← Login form ✓
├── signup/page.tsx                   ← Signup form ✓
├── feed/page.tsx                     ← Home screen with 3 prompt cards ✓
├── compose/page.tsx                  ← Song compose page ✓
├── compose/album/page.tsx            ← Album compose page ✓
├── compose/album/album-compose-form.tsx ← Album compose form ✓
├── search/page.tsx                   ← User search ✓
├── profile/[username]/               ← Profile page ✓
├── prompt/[date]/                    ← Date-based prompt page ✓
├── prompt/song-of-the-day/           ← Song of the Day feed ✓
├── prompt/daily-fun/                 ← Daily Prompt feed ✓
├── prompt/album-of-the-week/page.tsx ← Album of the Week feed (weekly cadence) ✓
└── api/
    ├── spotify/search/               ← iTunes song search ✓
    ├── itunes/album-search/          ← iTunes album search ✓
    └── cron/daily-reminder/          ← Daily push notification cron ✓

lib/supabase/
├── client.ts                 ← Browser Supabase client ✓
└── server.ts                 ← Server Supabase client ✓

proxy.ts                      ← Route protection (Next.js 16) ✓
```

## Supabase project

- Project ID: `juqspjspnyxqlcfkbalh`
- Profiles table: created and RLS enabled ✓
- Email confirmation: disabled permanently (no custom SMTP; password-only signup)
- `auth.users` is private — only accessible via Supabase dashboard or service role key

## Database schema

```sql
-- profiles (extends auth.users)
id uuid PK FK auth.users, username text UNIQUE, display_name text,
avatar_url text, bio text, created_at timestamptz

-- follows
follower_id uuid FK profiles, following_id uuid FK profiles,
created_at timestamptz, PRIMARY KEY (follower_id, following_id)

-- songs (iTunes metadata cache — shared across all posts)
id uuid PK, spotify_id text UNIQUE, title text, artist text,
album text, album_art_url text, spotify_url text, preview_url text,
created_at timestamptz

-- albums (iTunes album metadata cache)
id uuid PK, itunes_collection_id text UNIQUE, title text, artist text,
album_art_url text, apple_music_url text, created_at timestamptz

-- prompts
id uuid PK, title text, description text,
active_date date, prompt_type text CHECK (prompt_type IN ('song_of_the_day','daily_fun','album_of_the_week')),
UNIQUE (active_date, prompt_type), created_at timestamptz
-- Note: album_of_the_week uses Monday of the week as active_date

-- posts (song posts)
id uuid PK, user_id uuid FK profiles, song_id uuid FK songs,
prompt_id uuid FK prompts (nullable), caption text, created_at timestamptz

-- album_posts (album posts — separate from song posts)
id uuid PK, user_id uuid FK profiles, album_id uuid FK albums,
prompt_id uuid FK prompts (nullable), caption text, created_at timestamptz,
UNIQUE (user_id, prompt_id)

-- likes (for song posts)
user_id uuid FK profiles, post_id uuid FK posts,
created_at timestamptz, PRIMARY KEY (user_id, post_id)

-- album_post_likes (for album posts)
user_id uuid FK profiles, album_post_id uuid FK album_posts,
created_at timestamptz, PRIMARY KEY (user_id, album_post_id)

-- comments (for song posts)
id uuid PK, user_id uuid FK profiles, post_id uuid FK posts,
body text, created_at timestamptz

-- album_post_comments (for album posts)
id uuid PK, user_id uuid FK profiles, album_post_id uuid FK album_posts,
body text CHECK (char_length(body) <= 150), created_at timestamptz
```

## iTunes search flows

**Song search:** `/api/spotify/search?q=...` → iTunes `entity=song` → returns `SongResult`

**Album search:** `/api/itunes/album-search?q=...` → iTunes `entity=album` → returns `AlbumResult`
Both use 350ms debounce and re-rank results by title match closeness.

## Weekly cadence (Album of the Week)

- Uses Monday of current week in EST as `active_date` in the prompts table
- One post per user per prompt enforced via `UNIQUE (user_id, prompt_id)` on `album_posts`
- Page shows "This Week" and "Last Week" sections (same pattern as daily prompt pages)
- Prompts are auto-seeded every Monday at midnight EST by the `/api/cron/seed-album-prompt` cron

## Milestone progress

- [x] **M1 — Project setup**: Next.js scaffold, Supabase packages installed, route stubs, folder structure, `.env.local` template, clean build
- [x] **M2 — Auth**: Supabase email/password, sign up creates `profiles` row, `proxy.ts` protects `/feed` `/compose` `/search`, nav bar with auth state. Tested and working — signup lands on `/feed`.
- [x] **M3 — Database schema**: All tables in Supabase SQL editor, RLS policies, seed prompts.
- [x] **M4 — Music search**: iTunes Search API at `/api/spotify/search` (switched from Spotify — requires Premium), `SongSearchInput` component with 350ms debounce, `SongCard` component. Tested and working.
- [x] **M5 — Create post**: Composer page, song search + caption + submit, upserts song, creates post
- [x] **M6 — Feed**: Fetch posts from followed users + self, `FeedItem` component, click song → Apple Music
- [x] **M7 — Follow system**: `/search` to find users, follow/unfollow, profile page with post grid
- [x] **M8 — Daily prompts**: `/prompt/[date]` page, prompt banner on feed, seed prompts in DB
- [x] **M9 — Likes**: Like button on feed items, optimistic UI update
- [x] **M10 — Polish**: Loading skeletons, empty states, mobile responsive, onboarding
- [x] **M11 — Dual prompt system**: `prompt_type` column (`song_of_the_day` | `daily_fun`), unique constraint per `(active_date, prompt_type)`, one-post-per-user-per-prompt enforced at DB level
- [x] **M12 — Home screen redesign**: `/feed` replaced with two-card prompt hub (Song of the Day + Daily Prompt), live post counts per card. Feed items now show prompt label + formatted date. Prompt page read-only for past dates (post button hidden when `date !== today`), "← Home" back link added.
- [x] **M13 — Separate prompt type pages**: Each card now links to its own page (`/prompt/song-of-the-day`, `/prompt/daily-fun`). Each page shows today's + yesterday's prompt and posts. Tab switcher at the top lets you jump between the two. Fixed `createPost` upsert bug (partial unique index incompatible with Supabase `onConflict` column syntax — replaced with explicit select + insert/update). After posting, redirects back to the prompt page instead of home.
- [x] **M14 — Deployment**: Live at `https://music-social-eta.vercel.app`. GitHub repo public (robbiewise1/music-social). All env vars set cleanly in Vercel (BOM issue resolved by re-adding via CLI). `robots.txt` + `noindex` metadata — app is link-only, not search-indexed. Email confirmation disabled; password-only signup. Supabase redirect URLs configured for production domain.
- [x] **M15 — Post-launch polish**: Post timestamps in Eastern Time. Song search fetches 25 results from iTunes and re-ranks by title match so the typed song appears first. Tap like count to see who liked a post (works on mobile — inline dismiss on outside tap). Canada Day prompt seeded for July 1st. Git commits now use GitHub no-reply email instead of university email.
- [x] **M16 — Sort posts**: "Recent" / "Most Liked" toggle on all prompt pages (song-of-the-day, daily-fun, and date-based prompt pages). Client-side sort via `SortableFeedList` component — no refetch. Controls only appear when 2+ posts exist.
- [x] **M17 — Midnight EST date fix**: `new Date().toISOString()` returns UTC, causing the day to flip 4-5 hours early. Fixed in `feed/page.tsx` and `prompt-type-feed.tsx` using `toLocaleDateString("en-CA", { timeZone: "America/New_York" })` to get today's date in Eastern Time.
- [x] **M18 — PWA**: `public/manifest.json` added. `layout.tsx` updated with `manifest`, `appleWebApp`, `icons`, and `viewport` (themeColor) exports. Icon placeholders reference `public/icons/` — files to be added when designed. `InstallPrompt` client component on landing page and feed page — detects iOS vs Android, shows 4-step chip UI for iOS (··· → Share → Add to Home Screen → Add), uses `beforeinstallprompt` for one-tap Android install, auto-hides when already in standalone mode, dismisses to `localStorage`.
- [x] **M19 — Push notifications**: `public/sw.js` service worker handles push + notificationclick. `ServiceWorkerRegister` client component registers SW in layout. `PushPrompt` client component on feed page shows "Enable" banner (iOS-only when in standalone mode, skips if permission already set). `app/actions/push.ts` saves/deletes subscriptions in `push_subscriptions` table (admin client). `app/api/cron/daily-reminder/route.ts` sends daily reminders via web-push at 10am EST (15:00 UTC) to users who haven't posted today; cleans up stale 404/410 subscriptions. `vercel.json` registers the cron. Env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `CRON_SECRET`. Notification body: `"Check out today's prompt!"`. `NotificationToggle` client component on own profile page lets users enable/disable at any time (also used to refresh a stale subscription after VAPID key changes). Nav now links to own profile for logged-in users.
- [x] **M20 — Replies + engagement notifications**: `comments` table in Supabase (id, user_id, post_id, body, created_at; body capped at 150 chars via check constraint; RLS enabled). `app/actions/replies.ts` exposes `fetchReplies` and `addReply` server actions. `ReplyButton` client component sits beside the like button — shows chat bubble icon + count, expands inline on click to show replies and a submit form (lazy-loads replies on first open). Reply counts fetched server-side alongside like counts in `prompt-type-feed.tsx` and `prompt/[date]/page.tsx`. `lib/push.ts` shared helper `sendPushToUser(userId, payload)` looks up subscriptions, sends via web-push, and cleans stale 404/410 endpoints. `toggleLike` and `addReply` call this helper after a successful write — post owner gets "[Name] liked your song" or "[Name]: [reply preview]". No self-notifications.
- [x] **M21 — Album of the Week**: New weekly prompt type (`album_of_the_week`). Separate DB tables: `albums`, `album_posts`, `album_post_likes`, `album_post_comments`. Album search via iTunes `entity=album` at `/api/itunes/album-search`. New components: `AlbumCard`, `AlbumSearchInput`, `AlbumFeedItem`, `AlbumLikeButton`, `AlbumReplyButton`, `SortableAlbumFeedList`. New pages: `/prompt/album-of-the-week` (shows This Week + Last Week), `/compose/album`. Home feed updated to show third card. Weekly cadence: uses Monday of current week in EST as `active_date`. Likes and replies are fully separate from song post system. Seed new album prompts each Monday via Supabase SQL editor.
- [x] **M22 — Auto-seed Album of the Week**: `app/api/cron/seed-album-prompt/route.ts` runs every Monday at midnight EST (05:00 UTC). Computes Monday's date in EST, checks for an existing prompt, and inserts `"Album of the Week"` if none exists (idempotent). Registered in `vercel.json` at `0 5 * * 1`. Uses existing `CRON_SECRET`. No more manual SQL seeding needed.

## Production notes

- Env vars must be set via CLI (`vercel env add`) not web UI — web UI paste can introduce BOM characters (U+FEFF) that break auth headers
- Use `printf` (not `echo`) when piping secrets via Bash to avoid trailing newlines rejected by Vercel
- All three Supabase env vars are Sensitive in Vercel; `vercel env pull` returns them as empty — this is expected
- Supabase free tier pauses after 7 days of inactivity (auto-resumes on next request, ~30s cold start)
- Cron runs at 15:00 UTC = 10am EST / 11am EDT (no DST adjustment)
- `webpush.setVapidDetails()` must be called inside the request handler, not at module level — Next.js evaluates module-level code at build time when env vars are unavailable
- VAPID keys must be re-added via `printf | vercel env add` in Bash if they ever break — web UI and PowerShell echo both corrupt the value
- Album of the Week prompts are auto-seeded every Monday at midnight EST via `/api/cron/seed-album-prompt` (idempotent — safe to trigger manually if needed)

## MVP definition of done

You and 5 friends can sign up, respond to today's prompt, see each other's posts, and click through to Apple Music. Comments, notifications — deferred.

## Deferred features

- Apple Music / universal links (use song.link/Odesli API later)
- DMs
- "Currently playing" Spotify integration (requires user OAuth)
- Trending/discovery feed
- PWA icons (pending design)
