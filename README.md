# Lucky Cockroach Community

A community for India's students and youth — share what you're going through, and stand with people who understand.

Built with Next.js 16 (App Router, React 19) and Supabase (Postgres, Auth, Storage, RLS).

## Stack

- **Next.js 16** — App Router, Server Components, Server Actions
- **React 19**
- **Supabase** — Postgres with row-level security, Auth, Storage
- **Tailwind CSS v4**
- **Tiptap** — rich-text editor for posts and comments
- **Zod** — input validation

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_SITE_URL` — your deployed URL (used for metadata, sitemap, OG tags)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)

### 3. Run database migrations

Apply the SQL migrations in `supabase/migrations/` in order, using either the
Supabase CLI or the SQL editor in your project dashboard:

```
0001_init.sql              -- core tables (profiles, posts, topics, comments, votes…)
0002_logic.sql             -- triggers, scoring, rate-limit function
0003_rls_seed.sql          -- row-level security policies and seed data
0004_volunteers.sql        -- volunteer program
0005_storage.sql           -- "media" storage bucket
0006_post_image.sql        -- post image_url column
0007_settings_content.sql  -- site settings, crisis helplines
0008_comment_softdelete.sql -- comment soft-delete
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — lint the codebase

## Project structure

```
src/
  app/              # Next.js App Router routes
    admin/          # moderator + admin tools
    auth/callback/  # OAuth + email-link callback
    post/[id]/      # post detail
    t/[slug]/       # topic feed
    u/[username]/   # user profile
    ...
  components/       # UI, feed, post, comment, admin, layout
  lib/
    actions/        # server actions (posts, votes, comments, moderation, polls)
    supabase/       # client/server/middleware factories
    queries.ts      # data access layer
    auth.ts         # session + profile helpers
  middleware.ts     # auth session refresh
supabase/
  migrations/       # SQL schema, RLS, seeds
```

## Features

- Email/password and OAuth sign-in with onboarding flow
- Posts (text, link, image, poll) with topic tagging
- Comments with threaded replies and soft-delete
- Up/down voting with reputation scoring
- Topics: subscribe, explore, trending
- Search across posts, topics, and people
- Notifications (replies, mentions, mod actions)
- Saved posts, leaderboard, following feed
- Full moderation suite — reports, remove/lock/pin, audit log
- Admin panel — users, topics, reports, audit, appearance, helplines, volunteers
- Volunteer applications with admin review
- Database-enforced rate limits (posts, comments)

## Security

- All data access goes through Supabase RLS policies
- Service role key is server-only (used in privileged server actions)
- Security headers configured in `next.config.ts` (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
- Storage bucket "media" allows public reads, authenticated writes, 5MB cap

## Deployment

This app is ready to deploy to any platform that supports Next.js 16
(Vercel, Netlify, self-hosted Node). Set the environment variables from
`.env.example` in your hosting provider, and make sure all SQL migrations
have been applied to your production Supabase project.
