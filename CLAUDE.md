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
| Song data | Spotify API — Client Credentials flow (no user OAuth for MVP) |
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
├── login/page.tsx            ← Stub ✓
├── signup/page.tsx           ← Stub ✓
├── feed/page.tsx             ← Stub ✓
├── compose/page.tsx          ← Stub ✓
├── search/page.tsx           ← Stub ✓
├── profile/[username]/       ← Stub ✓
├── prompt/[date]/            ← Stub ✓
└── api/spotify/search/       ← Stub ✓

lib/supabase/
├── client.ts                 ← Browser Supabase client ✓
└── server.ts                 ← Server Supabase client ✓
```

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
- [ ] **M2 — Auth**: Supabase email/password, sign up creates `profiles` row, `proxy.ts` protects `/feed` `/compose` `/search`, nav bar with auth state
- [ ] **M3 — Database schema**: All tables in Supabase, RLS policies, seed 60+ prompts
- [ ] **M4 — Spotify search**: `/api/spotify/search` route with token caching, `SongSearchInput` component, `SongCard` component
- [ ] **M5 — Create post**: Composer page, song search + caption + submit, upserts song, creates post
- [ ] **M6 — Feed**: Fetch posts from followed users + self, `FeedItem` component, click song → Spotify
- [ ] **M7 — Follow system**: `/search` to find users, follow/unfollow, profile page with post grid
- [ ] **M8 — Daily prompts**: `/prompt/[date]` page, prompt banner on feed, seed prompts in DB
- [ ] **M9 — Likes**: Like button on feed items, optimistic UI update
- [ ] **M10 — Polish**: Loading skeletons, empty states, mobile responsive, onboarding

## MVP definition of done

You and 5 friends can sign up, follow each other, respond to today's prompt, see each other's posts, and click through to Spotify. Comments, notifications, Apple Music — all deferred.

## Deferred features

- Comments (add week 2 post-launch)
- Apple Music / universal links (use song.link/Odesli API later)
- Notifications, DMs
- "Currently playing" Spotify integration (requires user OAuth)
- Mobile app, trending/discovery feed
