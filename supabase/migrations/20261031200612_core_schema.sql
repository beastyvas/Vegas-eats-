-- =============================================================================
-- Core schema: reference data, listings, users, workflow queues, agents,
-- analytics, (dormant) subscriptions. RLS is enabled on every table.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.listing_type as enum ('home_seller', 'pop_up', 'food_truck', 'restaurant');
create type public.listing_status as enum ('draft', 'published', 'hidden', 'closed');
create type public.user_role as enum ('user', 'admin');
create type public.review_status as enum ('pending', 'approved', 'rejected');
create type public.candidate_status as enum ('new', 'approved', 'rejected', 'chain', 'duplicate');
create type public.chain_verdict as enum ('local', 'chain', 'unsure');

-- ---------------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
create table public.areas (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  blurb text,
  centroid_lat double precision not null,
  centroid_lng double precision not null,
  sort smallint not null default 100
);

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  emoji text,
  blurb text,
  sort smallint not null default 100,
  is_active boolean not null default true
);

create table public.valley_zips (
  zip text primary key check (zip ~ '^[0-9]{5}$')
);

-- ---------------------------------------------------------------------------
-- Profiles & admin bootstrap
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  zip text check (zip is null or zip ~ '^[0-9]{5}$'),
  is_valley boolean not null default false,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Emails listed here become admins the moment they sign up (or immediately,
-- if they already have an account — see promote trigger below).
create table public.admin_emails (
  email text primary key check (email = lower(email))
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

-- New auth user → profile row (admin if whitelisted).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    case when exists (select 1 from public.admin_emails a where a.email = lower(new.email))
         then 'admin'::public.user_role else 'user'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.promote_whitelisted_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles p set role = 'admin'
  from auth.users u
  where u.id = p.id and lower(u.email) = new.email;
  return new;
end $$;
create trigger admin_emails_promote after insert on public.admin_emails
  for each row execute function public.promote_whitelisted_admin();

-- Keep is_valley in sync with zip; block self-promotion to admin.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.is_valley := new.zip is not null
    and exists (select 1 from public.valley_zips v where v.zip = new.zip);
  if tg_op = 'UPDATE'
     and new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    raise exception 'only admins can change roles';
  end if;
  return new;
end $$;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 1 and 120),
  type public.listing_type not null,
  status public.listing_status not null default 'draft',
  area_id smallint references public.areas (id),
  price_level smallint check (price_level between 1 and 4),

  story_hook text check (char_length(story_hook) <= 140),   -- one-liner on every card
  origin_story text check (char_length(origin_story) <= 4000),
  what_to_order text check (char_length(what_to_order) <= 1000),
  -- { pickup: bool, dm: bool, walk_in: bool, delivery: bool, preorder: bool, notes: text }
  how_to_buy jsonb not null default '{}'::jsonb,
  order_url text,
  website text,
  phone text,
  email text,
  show_phone boolean not null default true,
  show_email boolean not null default false,

  -- Exact location: brick-and-mortar only. Home sellers NEVER get a street address.
  street_address text,
  city text,
  zip text check (zip is null or zip ~ '^[0-9]{5}$'),
  lat double precision,
  lng double precision,

  -- [{ "stage": "home_seller"|"pop_up"|"food_truck"|"restaurant", "year": 2019, "note": "..." }]
  growth_path jsonb not null default '[]'::jsonb,
  founded_year smallint check (founded_year between 1900 and 2100),

  license_number text,
  license_verified_at timestamptz,
  is_featured boolean not null default false,
  last_seen_active_at timestamptz,

  vouch_local_count integer not null default 0,
  vouch_total_count integer not null default 0,

  search_tsv tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(what_to_order, '') || ' ' || coalesce(story_hook, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(origin_story, '')), 'C')
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,

  constraint home_seller_no_address check (
    type <> 'home_seller'
    or (street_address is null and lat is null and lng is null and zip is null)
  )
);
create index listings_status_idx on public.listings (status);
create index listings_area_idx on public.listings (area_id);
create index listings_type_idx on public.listings (type);
create index listings_search_idx on public.listings using gin (search_tsv);
create index listings_name_trgm_idx on public.listings using gin (name extensions.gin_trgm_ops);
create trigger listings_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

create table public.listing_categories (
  listing_id uuid not null references public.listings (id) on delete cascade,
  category_id smallint not null references public.categories (id) on delete cascade,
  primary key (listing_id, category_id)
);
create index listing_categories_cat_idx on public.listing_categories (category_id);

create table public.listing_owners (
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);
create index listing_owners_user_idx on public.listing_owners (user_id);

-- Visibility / edit helpers (security definer so policies stay cheap & non-recursive)
create or replace function public.owns_listing(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.listing_owners o
    where o.listing_id = p_listing and o.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_edit_listing(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_admin() or public.owns_listing(p_listing);
$$;

create or replace function public.can_view_listing(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.listings l where l.id = p_listing and l.status = 'published')
      or public.can_edit_listing(p_listing);
$$;

-- Owners may edit their listing, but identity/location/trust fields are
-- admin-only; owners request those changes through edit_requests.
create or replace function public.listings_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Home sellers: strip any exact-location data defensively.
  if new.type = 'home_seller' then
    new.street_address := null; new.lat := null; new.lng := null; new.zip := null;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if tg_op = 'UPDATE'
     and current_user in ('authenticated', 'anon')
     and not public.is_admin() then
    if new.name is distinct from old.name
       or new.slug is distinct from old.slug
       or new.type is distinct from old.type
       or new.status is distinct from old.status
       or new.street_address is distinct from old.street_address
       or new.city is distinct from old.city
       or new.zip is distinct from old.zip
       or new.lat is distinct from old.lat
       or new.lng is distinct from old.lng
       or new.license_number is distinct from old.license_number
       or new.license_verified_at is distinct from old.license_verified_at
       or new.is_featured is distinct from old.is_featured
       or new.last_seen_active_at is distinct from old.last_seen_active_at
       or new.vouch_local_count is distinct from old.vouch_local_count
       or new.vouch_total_count is distinct from old.vouch_total_count
       or new.published_at is distinct from old.published_at then
      raise exception 'protected field: submit an edit request instead'
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger listings_guard before insert or update on public.listings
  for each row execute function public.listings_guard();

create table public.listing_hours (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  dow smallint not null check (dow between 0 and 6),   -- 0 = Sunday
  opens time not null,
  closes time not null                                  -- closes <= opens means past midnight
);
create index listing_hours_listing_idx on public.listing_hours (listing_id);

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  alt_text text not null check (char_length(btrim(alt_text)) between 3 and 300),
  is_owner_face boolean not null default false,
  sort smallint not null default 100,
  width integer,
  height integer,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index listing_photos_listing_idx on public.listing_photos (listing_id, sort);

create table public.listing_socials (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','facebook','x','youtube','yelp','google','website','other')),
  handle text,
  url text not null,
  unique (listing_id, platform, url)
);
create index listing_socials_handle_idx on public.listing_socials (platform, lower(handle));

-- ---------------------------------------------------------------------------
-- Trucks & pop-ups
-- ---------------------------------------------------------------------------
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  dow smallint not null check (dow between 0 and 6),
  starts time not null,
  ends time not null,
  location_name text not null check (char_length(location_name) <= 160),
  address text,
  lat double precision,
  lng double precision,
  area_id smallint references public.areas (id),
  notes text check (char_length(notes) <= 300),
  source text not null default 'owner' check (source in ('owner','admin')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index schedules_listing_idx on public.schedules (listing_id);
create index schedules_dow_idx on public.schedules (dow);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  posted_by uuid references auth.users (id) on delete set null,
  location_name text not null check (char_length(location_name) <= 160),
  address text,
  lat double precision,
  lng double precision,
  area_id smallint references public.areas (id),
  note text check (char_length(note) <= 200),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint checkin_window check (ends_at > starts_at and ends_at <= starts_at + interval '24 hours')
);
create index checkins_active_idx on public.checkins (ends_at);
create index checkins_listing_idx on public.checkins (listing_id);

-- ---------------------------------------------------------------------------
-- Vouches (locals voting). Weighting is applied at read time from app config:
-- is_local vouches count 1.0, others count NON_VALLEY_VOUCH_WEIGHT.
-- ---------------------------------------------------------------------------
create table public.vouches (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  note text check (char_length(note) <= 140),
  is_local boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references auth.users (id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);
create index vouches_listing_idx on public.vouches (listing_id, created_at desc);
create index vouches_created_idx on public.vouches (created_at desc);

-- ---------------------------------------------------------------------------
-- Ownership claims, edit requests, license verification
-- ---------------------------------------------------------------------------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  method text not null check (method in ('ig_code','email_code','phone_code','manual')),
  status public.review_status not null default 'pending',
  evidence text check (char_length(evidence) <= 2000),
  contact_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index claims_status_idx on public.claims (status, created_at);
create unique index claims_one_pending on public.claims (listing_id, user_id) where status = 'pending';

-- Verification codes live in their own admin/service-only table so a
-- claimant can never read a hash and brute-force it.
create table public.claim_codes (
  claim_id uuid primary key references public.claims (id) on delete cascade,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null
);

create table public.edit_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  changes jsonb not null,
  reason text check (char_length(reason) <= 1000),
  status public.review_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index edit_requests_status_idx on public.edit_requests (status, created_at);

create table public.license_verifications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  submitted_by uuid not null references auth.users (id) on delete cascade,
  license_number text not null check (char_length(license_number) <= 80),
  license_kind text not null default 'cottage_food' check (license_kind in ('cottage_food','business','health_permit','other')),
  status public.review_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Candidates & agent pipeline
-- ---------------------------------------------------------------------------
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null check (agent in ('discovery','chain_check','liveness','enrichment')),
  model text,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  sources text[] not null default '{}',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  web_search_requests integer not null default 0,
  cost_usd numeric(10,4) not null default 0,
  status text not null default 'running' check (status in ('running','succeeded','failed','skipped_budget')),
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index agent_runs_started_idx on public.agent_runs (started_at desc);

create table public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  agent text not null check (agent in ('discovery','chain_check','liveness','enrichment')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','done','failed')),
  attempts smallint not null default 0,
  last_error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index agent_jobs_queue_idx on public.agent_jobs (status, run_after);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('seed','discovery','suggestion','manual')),
  source_file text,
  raw jsonb not null default '{}'::jsonb,
  name text not null,
  type public.listing_type,
  categories text[] not null default '{}',      -- free text / slugs; mapped on approval
  area text,                                    -- free text; mapped on approval
  socials jsonb not null default '{}'::jsonb,   -- { instagram: "@handle", tiktok: "...", website: "..." }
  how_to_buy text,
  phone text,
  email text,
  website text,
  address text,
  source_urls text[] not null default '{}',
  origin_draft text,
  dishes text,
  confidence numeric(3,2) check (confidence between 0 and 1),
  seed_note text,                               -- e.g. "check", "verify" from the CSV
  dedupe_key text not null,
  status public.candidate_status not null default 'new',
  listing_id uuid references public.listings (id) on delete set null,
  duplicate_of uuid references public.candidates (id) on delete set null,
  admin_note text,
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index candidates_status_idx on public.candidates (status, created_at desc);
create index candidates_dedupe_idx on public.candidates (dedupe_key);
create index candidates_name_trgm_idx on public.candidates using gin (name extensions.gin_trgm_ops);
create trigger candidates_updated_at before update on public.candidates
  for each row execute function public.set_updated_at();

create table public.chain_checks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references public.candidates (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete cascade,
  verdict public.chain_verdict not null,
  is_franchise boolean,
  out_of_state_locations integer,
  nevada_locations integer,
  reasoning text,
  evidence_urls text[] not null default '{}',
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  admin_decision public.chain_verdict,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (candidate_id is not null or listing_id is not null)
);
create index chain_checks_candidate_idx on public.chain_checks (candidate_id, created_at desc);
create index chain_checks_listing_idx on public.chain_checks (listing_id, created_at desc);

-- Agent-proposed field updates (enrichment, schedule proposals). Never auto-applied.
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  kind text not null default 'field' check (kind in ('field','schedule')),
  field text,
  value jsonb not null,
  source_urls text[] not null default '{}',
  rationale text,
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  status public.review_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index suggestions_status_idx on public.suggestions (status, created_at);

create table public.flags (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete cascade,
  vouch_id uuid references public.vouches (id) on delete cascade,
  kind text not null check (kind in ('dormant','closed','vouch_burst','report','chain_suspect')),
  detail text,
  evidence_urls text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,   -- null = agent/cron
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index flags_open_idx on public.flags (status, kind, created_at desc);

create table public.outreach (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  channel text not null check (channel in ('email','ig_dm')),
  recipient text,
  subject text,
  body text not null,
  status text not null default 'drafted' check (status in ('drafted','sent','claimed','skipped')),
  sent_at timestamptz,
  sent_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index outreach_status_idx on public.outreach (status, created_at);

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------
create table public.events (
  id bigint generated always as identity primary key,
  listing_id uuid references public.listings (id) on delete cascade,
  kind text not null check (kind in ('view','click_order','click_instagram','click_tiktok','click_directions','click_phone','click_website','click_social')),
  session_hash text,
  referrer_host text,
  created_at timestamptz not null default now()
);
create index events_listing_idx on public.events (listing_id, created_at desc);
create index events_created_idx on public.events (created_at desc);

create table public.listing_stats_daily (
  listing_id uuid not null references public.listings (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  clicks_order integer not null default 0,
  clicks_instagram integer not null default 0,
  clicks_directions integer not null default 0,
  clicks_phone integer not null default 0,
  clicks_website integer not null default 0,
  clicks_other integer not null default 0,
  vouches integer not null default 0,
  primary key (listing_id, day)
);

create table public.searches (
  id bigint generated always as identity primary key,
  query text,
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null,
  created_at timestamptz not null default now()
);
create index searches_created_idx on public.searches (created_at desc);

-- ---------------------------------------------------------------------------
-- Monetization (dormant behind PAYMENTS_ENABLED)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
