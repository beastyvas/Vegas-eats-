-- =============================================================================
-- Move RLS helpers & trigger functions out of the API-exposed `public` schema.
-- Policies/triggers reference functions by OID, so they keep working; function
-- bodies that call each other by name are recreated against `private.*`.
-- =============================================================================
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

alter function public.is_admin() set schema private;
alter function public.owns_listing(uuid) set schema private;
alter function public.can_edit_listing(uuid) set schema private;
alter function public.can_view_listing(uuid) set schema private;
alter function public.can_vouch(uuid) set schema private;
alter function public.setting_int(text, integer) set schema private;
alter function public.refresh_vouch_counts(uuid) set schema private;
alter function public.handle_new_user() set schema private;
alter function public.promote_whitelisted_admin() set schema private;
alter function public.profiles_guard() set schema private;
alter function public.listings_guard() set schema private;
alter function public.vouches_before() set schema private;
alter function public.vouches_after() set schema private;
alter function public.set_updated_at() set schema private;

create or replace function private.can_edit_listing(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.owns_listing(p_listing);
$$;

create or replace function private.can_view_listing(p_listing uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.listings l where l.id = p_listing and l.status = 'published')
      or private.can_edit_listing(p_listing);
$$;

create or replace function private.can_vouch(p_listing uuid) returns boolean
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
  if v_created > now() - make_interval(mins => private.setting_int('vouch_min_account_age_minutes', 0)) then
    return false;
  end if;
  if not exists (select 1 from public.listings l where l.id = p_listing and l.status = 'published') then
    return false;
  end if;
  if (select count(*) from public.vouches v
       where v.user_id = v_uid and v.created_at > now() - interval '24 hours')
     >= private.setting_int('vouch_rate_limit_per_day', 20) then
    return false;
  end if;
  return true;
end $$;

create or replace function private.profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.is_valley := new.zip is not null
    and exists (select 1 from public.valley_zips v where v.zip = new.zip);
  if tg_op = 'UPDATE'
     and new.role is distinct from old.role
     and current_user in ('authenticated', 'anon')
     and not private.is_admin() then
    raise exception 'only admins can change roles' using errcode = '42501';
  end if;
  return new;
end $$;

create or replace function private.listings_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'home_seller' then
    new.street_address := null; new.lat := null; new.lng := null; new.zip := null;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if tg_op = 'UPDATE'
     and current_user in ('authenticated', 'anon')
     and not private.is_admin() then
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

create or replace function private.vouches_before() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.is_local := coalesce((select p.is_valley from public.profiles p where p.id = new.user_id), false);
    new.voided_at := null; new.voided_by := null;
  elsif current_user in ('authenticated','anon') and not private.is_admin() then
    new.listing_id := old.listing_id; new.user_id := old.user_id; new.is_local := old.is_local;
    new.voided_at := old.voided_at; new.voided_by := old.voided_by; new.void_reason := old.void_reason;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

create or replace function private.vouches_after() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_vouch_counts(coalesce(new.listing_id, old.listing_id));
  return null;
end $$;

-- Lock down: trigger functions & internal helpers are not callable by clients.
revoke all on all functions in schema private from public, anon, authenticated;
-- RLS helpers must be executable by the roles whose policies call them.
grant execute on function private.is_admin(), private.owns_listing(uuid),
  private.can_edit_listing(uuid), private.can_view_listing(uuid), private.can_vouch(uuid)
  to anon, authenticated;
grant execute on all functions in schema private to service_role;

-- Open-now is a legit public RPC; run it as the caller so RLS applies.
alter function public.is_open_at(uuid, timestamptz) security invoker;
