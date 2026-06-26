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
├── page.tsx                  ← Landing page ✓
├── layout.tsx                ← Root layout with <Nav /> ✓
├── _components/nav.tsx       ← Auth-aware nav bar (server component) ✓
├── actions/auth.ts           ← signup / login / logout server actions ✓
├── login/page.tsx            ← Login form ✓
├── signup/page.tsx           ← Signup form ✓
├── feed/page.tsx             ← Stub
├── compose/page.tsx          ← Stub
├── search/page.tsx           ← Stub
├── profile/[username]/       ← Stub
├── prompt/[date]/            ← Stub
└── api/spotify/search/       ← Stub

lib/supabase/
├── client.ts                 ← Browser Supabase client ✓
└── server.ts                 ← Server Supabase client ✓

proxy.ts                      ← Route protection (Next.js 16) ✓
```

## Supabase project

- Project ID: `juqspjspnyxqlcfkbalh`
- Profiles table: created and RLS enabled ✓
- Email confirmation: disabled for development (re-enable before launch)

## Database schema (implement in Milestone 3)

```sql
-- profiles (extends auth.users)
id uuid PK FK auth.users, username text UNIQUE, display_name text,
avatar_url text, bio text, created_at timestamptz

-- follows
follower_id uuid FK profiles, following_id uuid FK profiles,
created_at timestamptz, PRIMARY KEY (follower_id, following_id)

-- songs (Spotify metadata cache — shared across all posts)
id uuid PK, spotify_id text UNIQUE, title text, artist text,
album text, album_art_url text, spotify_url text, preview_url text,
created_at timestamptz

-- prompts
id uuid PK, title text, description text,
active_date date UNIQUE, created_at timestamptz

-- posts
id uuid PK, user_id uuid FK profiles, song_id uuid FK songs,
prompt_id uuid FK prompts (nullable), caption text, created_at timestamptz

-- likes
user_id uuid FK profiles, post_id uuid FK posts,
created_at timestamptz, PRIMARY KEY (user_id, post_id)

-- comments (build after launch)
id uuid PK, user_id uuid FK profiles, post_id uuid FK posts,
body text, created_at timestamptz
```

## Spotify search flow (implement in Milestone 4)

1. User types in composer → debounced call to `/api/spotify/search?q=...`
2. Route handler gets/refreshes a Client Credentials token (cache it module-level with expiry check)
3. Calls Spotify Search API, returns shaped results: `{ spotify_id, title, artist, album, album_art_url, spotify_url, preview_url }`
4. On post submit: `UPSERT INTO songs ON CONFLICT (spotify_id) DO NOTHING`, then `INSERT INTO posts`

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

## MVP definition of done

You and 5 friends can sign up, follow each other, respond to today's prompt, see each other's posts, and click through to Spotify. Comments, notifications, Apple Music — all deferred.

## Deferred features

- Comments (add week 2 post-launch)
- Apple Music / universal links (use song.link/Odesli API later)
- Notifications, DMs
- "Currently playing" Spotify integration (requires user OAuth)
- Mobile app, trending/discovery feed
