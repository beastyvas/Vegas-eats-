-- =============================================================================
-- Phase 3: claimed marker, photo storage, owner stats.
-- Idempotent: safe to run more than once (e.g. pasted into the SQL editor).
-- =============================================================================

-- ---------- "Owner verified" marker ----------
-- Public pages can't read listing_owners (private), so keep a timestamp on the
-- listing itself, maintained by trigger.
alter table public.listings add column if not exists claimed_at timestamptz;

create or replace function private.sync_claimed_at() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_listing uuid := coalesce(new.listing_id, old.listing_id);
begin
  update public.listings l
     set claimed_at = (select min(o.verified_at) from public.listing_owners o where o.listing_id = v_listing)
   where l.id = v_listing;
  return null;
end $$;
revoke all on function private.sync_claimed_at() from public, anon, authenticated;
drop trigger if exists listing_owners_sync_claimed on public.listing_owners;
create trigger listing_owners_sync_claimed after insert or delete on public.listing_owners
  for each row execute function private.sync_claimed_at();

-- claimed_at is system-owned: owners can't set it.
create or replace function private.listings_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
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
       or new.heat_score is distinct from old.heat_score
       or new.heat_updated_at is distinct from old.heat_updated_at
       or new.claimed_at is distinct from old.claimed_at
       or new.published_at is distinct from old.published_at then
      raise exception 'protected field: submit an edit request instead'
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

-- ---------- Owner analytics ----------
-- Owners may read raw events for their own listings (session hashes only, no PII).
drop policy if exists events_owner_read on public.events;
create policy events_owner_read on public.events for select to authenticated
  using (private.can_edit_listing(listing_id));

-- Per-listing counts for the owner dashboard. Runs as the caller, so RLS
-- limits it to listings the caller owns (or admins).
create or replace function public.listing_stats(p_listing uuid, p_since timestamptz)
returns table (kind text, total bigint, uniques bigint)
language sql stable security invoker set search_path = '' as $$
  select e.kind, count(*) as total, count(distinct e.session_hash) as uniques
  from public.events e
  where e.listing_id = p_listing and e.created_at >= p_since
  group by e.kind
  union all
  select 'vouch', count(*), count(*)
  from public.vouches v
  where v.listing_id = p_listing and v.created_at >= p_since and v.voided_at is null
    and private.can_edit_listing(p_listing);
$$;
revoke all on function public.listing_stats(uuid, timestamptz) from public, anon;
grant execute on function public.listing_stats(uuid, timestamptz) to authenticated;

-- Owners can read vouch rows on their own listings (for counts above).
drop policy if exists vouches_owner_read on public.vouches;
create policy vouches_owner_read on public.vouches for select to authenticated
  using (private.can_edit_listing(listing_id));

-- ---------- Photo storage ----------
-- Public bucket; objects live at "<listing_id>/<file>". Only the listing's
-- owners (or admins) can write under that prefix.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.photo_path_listing(p_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f-]{36}$' then split_part(p_name, '/', 1)::uuid end;
$$;
grant execute on function private.photo_path_listing(text) to anon, authenticated;

drop policy if exists listing_photos_public_read on storage.objects;
create policy listing_photos_public_read on storage.objects for select
  using (bucket_id = 'listing-photos');
drop policy if exists listing_photos_owner_insert on storage.objects;
create policy listing_photos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and private.can_edit_listing(private.photo_path_listing(name)));
drop policy if exists listing_photos_owner_update on storage.objects;
create policy listing_photos_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and private.can_edit_listing(private.photo_path_listing(name)));
drop policy if exists listing_photos_owner_delete on storage.objects;
create policy listing_photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and private.can_edit_listing(private.photo_path_listing(name)));
