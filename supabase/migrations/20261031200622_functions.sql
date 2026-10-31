-- =============================================================================
-- Functions & triggers used by RLS and the app.
-- =============================================================================

-- DB-enforced knobs (app-level knobs live in /config/app.ts).
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text
);
insert into public.app_settings (key, value, description) values
  ('vouch_rate_limit_per_day', '20', 'Max vouches a single user can create in 24h'),
  ('vouch_min_account_age_minutes', '0', 'Minimum account age before vouching');

create or replace function public.setting_int(p_key text, p_default integer) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::integer from public.app_settings where key = p_key), p_default);
$$;

-- ---------- Vouching ----------
create or replace function public.can_vouch(p_listing uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_confirmed timestamptz;
  v_created timestamptz;
begin
  if v_uid is null then return false; end if;
  select u.email_confirmed_at, u.created_at into v_confirmed, v_created
    from auth.users u where u.id = v_uid;
  if v_confirmed is null then return false; end if;
  if v_created > now() - make_interval(mins => public.setting_int('vouch_min_account_age_minutes', 0)) then
    return false;
  end if;
  if not exists (select 1 from public.listings l where l.id = p_listing and l.status = 'published') then
    return false;
  end if;
  if (select count(*) from public.vouches v
       where v.user_id = v_uid and v.created_at > now() - interval '24 hours')
     >= public.setting_int('vouch_rate_limit_per_day', 20) then
    return false;
  end if;
  return true;
end $$;

create or replace function public.vouches_before() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.is_local := coalesce((select p.is_valley from public.profiles p where p.id = new.user_id), false);
    new.voided_at := null; new.voided_by := null;
  elsif current_user in ('authenticated','anon') and not public.is_admin() then
    -- Users may only edit their note.
    new.listing_id := old.listing_id; new.user_id := old.user_id; new.is_local := old.is_local;
    new.voided_at := old.voided_at; new.voided_by := old.voided_by; new.void_reason := old.void_reason;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger vouches_before before insert or update on public.vouches
  for each row execute function public.vouches_before();

create or replace function public.refresh_vouch_counts(p_listing uuid) returns void
language sql security definer set search_path = '' as $$
  update public.listings l set
    vouch_local_count = s.local_count,
    vouch_total_count = s.total_count
  from (
    select count(*) filter (where is_local) as local_count, count(*) as total_count
    from public.vouches where listing_id = p_listing and voided_at is null
  ) s
  where l.id = p_listing;
$$;

create or replace function public.vouches_after() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.refresh_vouch_counts(coalesce(new.listing_id, old.listing_id));
  return null;
end $$;
create trigger vouches_after after insert or update or delete on public.vouches
  for each row execute function public.vouches_after();

-- ---------- Open now (America/Los_Angeles; overnight-aware) ----------
create or replace function public.is_open_at(p_listing uuid, p_at timestamptz default now()) returns boolean
language sql stable security definer set search_path = '' as $$
  with t as (
    select (p_at at time zone 'America/Los_Angeles') as local_ts
  ), parts as (
    select extract(dow from local_ts)::int as dow, local_ts::time as tod from t
  )
  select exists (
    select 1 from public.listing_hours h, parts p
    where h.listing_id = p_listing and (
      (h.closes > h.opens and h.dow = p.dow and p.tod >= h.opens and p.tod < h.closes)
      or (h.closes <= h.opens and (
            (h.dow = p.dow and p.tod >= h.opens)
         or (h.dow = (p.dow + 6) % 7 and p.tod < h.closes)))
    )
  ) or exists (
    select 1 from public.checkins c
    where c.listing_id = p_listing and p_at >= c.starts_at and p_at < c.ends_at
  );
$$;
