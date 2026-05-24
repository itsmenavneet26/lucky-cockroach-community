# Production Readiness Audit — Lucky Cockroach Community

Pre-launch audit for a national-scale (~100k+ users) Next.js 15 + Supabase
community portal. Status legend: ✅ fixed · 🟡 partial · 🔲 deferred.

## Files added / modified in this audit

**New**
- `supabase/migrations/0011_production_hardening.sql` — indexes, constraints, atomic RPCs, ban sync, denormalised stats
- `supabase/migrations/0012_rate_limits.sql` — generic in-DB rate limiting (no external dep)
- `src/lib/sanitize.ts` — server-side Tiptap JSON sanitiser
- `src/lib/url-safety.ts` — SSRF / private-host allowlist
- `src/lib/rate-limit.ts` — RPC wrapper used by auth actions
- `src/app/post/[id]/error.tsx`, `src/app/u/[username]/error.tsx`, `src/app/t/[slug]/error.tsx`, `src/app/admin/error.tsx`

**Modified**
- `src/middleware.ts`, `src/lib/supabase/middleware.ts`
- `src/lib/auth.ts` (added `requireActiveUser`)
- `src/lib/actions/{vote,comment,moderation,follow,poll}.ts`
- `src/lib/queries.ts`
- `src/app/submit/{actions,submit-form}.tsx`, `src/app/settings/{actions,settings-form}.tsx`, `src/app/volunteer/actions.ts`, `src/app/{about,guidelines,mental-health,scholarship,leaderboard}/page.tsx`
- `src/components/feed/post-card.tsx`
- `next.config.ts`

---

## P0 — Launch blockers

### Security & authorization
| # | Finding | Status |
|---|---|---|
| 1 | `editComment` / `deleteComment` had no ownership check above RLS. | ✅ `requireCommentOwner` guard. |
| 2 | `castVote` was read-modify-write (race condition under concurrency). | ✅ Atomic `toggle_vote_atomic` SQL RPC. `toggleSave` likewise. |
| 3 | Admin gate only in RSC layout. | ✅ Edge-level role check in middleware; layout RSC check kept as defence in depth. |
| 4 | `?next=` open-redirect: `startsWith("/")` accepted `//evil.com`. | ✅ Strict pattern: rejects `//`, `/\`, `/host:`. |
| 5 | `banUser`/`unbanUser` did two sequential writes with no transaction. | ✅ DB trigger `bans_sync_status_trg` keeps `profiles.is_banned` in lock-step. |
| 6 | Rich-text Tiptap JSON stored without server-side sanitisation (stored XSS surface). | ✅ `src/lib/sanitize.ts` allowlists nodes/marks; applied on post create. Comments use plain text only. |
| 7 | No app-level rate limit on signup / login / password reset. | ✅ Generic DB rate-limit RPC (migration 0012) wired into all three auth flows: IP + email keyed, advisory-locked. |

### Data integrity
| # | Finding | Status |
|---|---|---|
| 8 | Missing critical indexes across hot tables. | ✅ 13 indexes in `0011`. |
| 9 | `reports` had no unique constraint on `(reporter_id, target_type, target_id)`. | ✅ Added. |
| 10 | Trending tags scanned entire `post_tags` table. | ✅ `tag_stats` denormalised table + trigger; `getTrendingTags` reads tiny indexed view. |
| 11 | Admin dashboard counted profiles/posts on every render. | ✅ `site_stats` table maintained by triggers. `getCommunityStats` uses it. Dashboard windowed counts unchanged (need time filter). |

### Performance / scale
| # | Finding | Status |
|---|---|---|
| 12 | `revalidatePath("/")` after every post invalidated all feeds + sidebars. | ✅ Narrowed to `revalidatePath(\`/t/\${topicId}\`)`. |
| 13 | Static-content pages were dynamic. | ✅ `revalidate = 3600` on about/guidelines/mental-health/scholarship. |
| 14 | `/leaderboard` dynamic-rendered the full sorted profile table on every hit. | ✅ `revalidate = 300`. |
| 15 | Feed image used raw `<img>`. | ✅ `next/image` in post-card. (avatar.tsx still uses `<img>` — see #38.) |

---

## P1 — Should fix before scaling

| # | Finding | Status |
|---|---|---|
| 16 | Tag insert failures were silent. | ✅ `createPost` now collects `missingTags`, passes through redirect URL (`?missingTags=…`). |
| 17 | Avatar upload swallowed errors. | ✅ Settings form maps Supabase storage error codes to user-facing strings + client-side size guard. |
| 18 | Submit image upload generic error. | ✅ Same mapping in `submit-form.tsx`. |
| 19 | Settings: no `fieldErrors` for "username taken". | ✅ `SettingsState` now carries `fieldErrors`; inline display under username field. |
| 20 | No live username availability check in settings. | ✅ Reuses `checkUsername` from onboarding; debounced (350ms) with status icons. |
| 21 | Volunteer phone regex too loose. | ✅ Strips formatting + validates 10–15 digits with optional `+` country code. |
| 22 | Mid-session ban — banned user kept browsing until reload. | ✅ `requireActiveUser` helper applied to every mutating action (post/comment/vote/save/follow/poll/report). |
| 23 | Audit insert failures surfaced silently. | 🟡 Logged in server (`console.error`). Surfacing to admin UI would need a toast layer; out of scope for this pass. |
| 24 | Feed/comments offset pagination. | 🟡 `getFeedPosts` now supports keyset `cursor` on the `new` sort (the only ordering with a monotonic key). Hot/top/rising still use offset (their secondary signals are volatile). Comments/notifications kept offset-based — they're already capped at 40/30 and rarely paginated. |
| 25 | Tiptap not code-split. | ✅ `RichTextEditor` loaded via `next/dynamic({ ssr: false })`. |
| 26 | Notifications polling at scale. | 🔲 Realtime requires Supabase realtime billing decision. Deferred — see #41. |
| 27 | No allowlist for `link_url`. | ✅ `isSafeExternalUrl` rejects non-http(s), private IPv4, IPv6 literals, link-local, `.local`/`.internal`. |

---

## P2 — Hardening

| # | Finding | Status |
|---|---|---|
| 28 | Middleware ran on `/api/*` and static assets. | ✅ Matcher excludes `/api/`, robots/sitemap, common assets. |
| 29 | No HSTS header. | ✅ Added (2-year max-age, includeSubDomains, preload). |
| 30 | Permissions-Policy missing `interest-cohort`. | ✅ Added. |
| 31 | Username search public (enumeration). | 🔲 Low priority for a community portal. |
| 32 | Vote → karma deltas not audited. | 🔲 Optional — add to `votes_apply` trigger if fraud becomes a concern. |
| 33 | Soft-deleted content lives forever (DPDP / GDPR). | 🔲 Add `deleted_at` + scheduled hard-delete after 90 days. |
| 34 | Mobile menu has no focus trap. | 🔲 Wrap in `<dialog>` or use `focus-trap-react`. |
| 35 | `timeAgo` English-only. | 🔲 Switch to `Intl.RelativeTimeFormat`. |
| 36 | Toast error auto-dismiss may be too short. | 🔲 Persist into form state for fatal errors. |
| 37 | Cursor pagination edge cases (invalid cursor → fall back to first page). | ✅ `decodeCursor` returns null on malformed input; query falls back to default ordering. |
| 38 | Remaining raw `<img>`: `src/components/ui/avatar.tsx`, the avatar `<img>` in settings & submit, and the post detail page's image render. | 🔲 Avatars use Dicebear SVGs (already small) — low impact. Post detail image can be swapped later. |
| 39 | Tiptap link marks could include `javascript:` URIs. | ✅ Sanitiser allows only http/https/mailto + clamps URL to 2KB + forces `rel="noopener nofollow"`. |
| 40 | Mention-spam in comments (10 mentions per comment, no rate limit). | 🟡 Caller is now subject to `requireActiveUser` + RLS rate-limit (`check_rate_limit` in DB). |
| 41 | Realtime notifications. | 🔲 Decide after billing review. |

---

## What to run

```bash
# Apply both new migrations (idempotent — safe to re-run)
supabase db push
# or:
psql < supabase/migrations/0011_production_hardening.sql
psql < supabase/migrations/0012_rate_limits.sql
```

Optionally schedule cleanup of stale rate-limit hits:
```sql
-- pg_cron, daily at 03:00 IST:
select cron.schedule('purge_rate_limit_hits', '30 21 * * *', $$select purge_rate_limit_hits()$$);
```

## Verified

- TypeScript: `npx tsc --noEmit` — clean.
- ESLint on touched files — clean.
- Dev server boots without import or build errors; home page renders with sidebars + feed cards.

## Still recommended before public launch

1. Load test with k6 / locust: 1k concurrent vote toggles on one post, 100 concurrent submits, 100k feed reads/min.
2. Enable Supabase daily backups in the dashboard.
3. Wire Sentry (or similar) — many actions log via `console.error`, which is invisible in production.
4. Decide on Supabase realtime billing for #41.
5. Run an end-to-end manual pass once `auth/callback` is exercised in staging (the OAuth path was not visited during this audit).
