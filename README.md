# {{BRAND}}: Las Vegas locals-only food directory

**No chains. If it's not locally owned, it's not on here.** Home cooks, pop-ups, food trucks, and locally owned restaurants,
vouched for by people who live here.

Stack: Next.js 16 (App Router, TypeScript) on Vercel · Supabase (Postgres + RLS, Auth, Storage) · Tailwind CSS v4 ·
Anthropic API (agents, Phase 6) · Stripe (built, switched off; Phase 7) · MapLibre GL + OpenFreeMap tiles (Phase 2).

> Build status: **Phase 1 of 8 complete** (schema, RLS, auth, seed import, candidate queue). See [Build phases](#build-phases).

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev                  # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Vitest unit tests (`tests/unit`) |
| `npm run typecheck` / `lint` | `tsc --noEmit` / ESLint |
| `npm run import:seed` | Imports `/seed/*.csv` as **candidates** (needs the service-role key) |

## Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | anon or publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | same | **server only**: seed import, cron, analytics beacon. Never prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | you | e.g. `https://example.com`; used for canonical URLs, sitemap, OG |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Phase 6 agents |
| `CRON_SECRET` | any long random string | Vercel Cron sends it as a Bearer token |
| `RESEND_API_KEY`, `OUTREACH_FROM_EMAIL` | resend.com | Phase 6 outreach (sent only when you click Send) |
| `PAYMENTS_ENABLED` | `false` | Phase 7. Leave `false` until you decide to sell Featured |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_FEATURED_PRICE_ID` | Stripe | Phase 7 |

## Database (Supabase)

Migrations live in `supabase/migrations/` and are applied in filename order. They're already applied to the
`Vegas-eats-` project. For a fresh project:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

…or paste each migration into the SQL editor in order.

**Regenerate TypeScript types** after schema changes:

```bash
npx supabase gen types typescript --project-id <ref> --schema public > lib/database.types.ts
```

**RLS model**
- Public (anon) reads reference data and **published** listings and their children only.
- Owners (`listing_owners`) edit their listing. A trigger blocks changes to name, slug, type, status, address, license,
  featured, and vouch counts. Those go through `edit_requests`.
- Home sellers **never** store a street address, zip, or coordinates (`CHECK` constraint + trigger).
- Vouch rows are private. Public counts are denormalized on `listings` by trigger, and voided vouches are excluded.
  Inserting a vouch requires a confirmed email, a published listing, and the daily rate limit (`app_settings`).
- Candidates, chain checks, flags, agent runs/jobs, outreach, events, and searches are admin-only.
- RLS helper and trigger functions live in a non-exposed `private` schema.

**RLS tests**: `supabase/tests/rls_test.sql` runs inside a transaction and rolls back:
```bash
psql "$DATABASE_URL" -f supabase/tests/rls_test.sql   # prints "ALL RLS TESTS PASSED"
```

### Making yourself admin

Admins are whitelisted by email in the `admin_emails` table. Run once in the Supabase SQL editor:

```sql
insert into public.admin_emails (email) values ('you@example.com');
```

If that email already has an account, it's promoted immediately. Otherwise it's promoted on first sign-in.

### Auth setup (Supabase dashboard)

1. **Authentication → URL Configuration**: Site URL = your domain. Add `http://localhost:3000/auth/callback` and
   `https://<your-domain>/auth/callback` to Redirect URLs.
2. **Email (magic link)** works out of the box (rate-limited on Supabase's built-in SMTP; add custom SMTP like Resend for production).
3. **Google**: Authentication → Providers → Google. Create an OAuth client in Google Cloud Console with redirect URI
   `https://<ref>.supabase.co/auth/v1/callback`, then paste the client ID/secret.

## Seed data

Put CSVs in `/seed/` and run `npm run import:seed`, or upload them at **/admin/import**. Rows become
**candidates**, never live listings, and each gets a chain-check job queued. Headers are matched loosely (`name/business`,
`ig/instagram`, `area/neighborhood`, `known for/dishes`, …). Rows with "check"/"verify" anywhere are tagged so you can filter them.
Re-running is safe: duplicates (same normalized name or IG handle) are skipped.

## Swapping the brand

Everything brand-related is in **`config/brand.ts`**: name, tagline, description, domain, IG handle, and colors.
Colors flow into Tailwind as `bg-chile`, `text-green`, etc. via CSS variables. Change the file and redeploy.

## Deploy to Vercel

1. Import the GitHub repo in Vercel (framework: Next.js).
2. Add the env vars above (Production + Preview).
3. Deploy. Add your domain, then update `NEXT_PUBLIC_SITE_URL` and Supabase's Site URL/Redirect URLs.
4. Cron jobs (Phase 6) are declared in `vercel.json` and need `CRON_SECRET` set.

## Build phases

1. ✅ Schema + RLS + auth (magic link, Google, zip onboarding) + seed import + candidate queue
2. Public directory, listing pages, search/filters, SEO pages, map
3. Claim flow + owner dashboard + analytics events
4. Vouches with zip weighting + rankings
5. Truck schedules + check-ins + "today" page
6. Agent pipeline (discovery, chain-check, liveness, enrichment) + outreach queue
7. Stripe "Featured" behind `PAYMENTS_ENABLED=false`
8. Lighthouse pass + docs polish
