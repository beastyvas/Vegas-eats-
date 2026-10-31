-- =============================================================================
-- Phase 2: "Heating up" score + search.
-- =============================================================================

-- ---------- Heat ----------
-- Stored on listings so public pages stay static/cheap. Recomputed by cron
-- (service role) via public.refresh_heat(). Momentum = this week's activity,
-- plus a bonus for beating the listing's own recent weekly baseline, plus a
-- decaying "new on the list" boost.
alter table public.listings
  add column if not exists heat_score numeric(10,2) not null default 0,
  add column if not exists heat_updated_at timestamptz;
create index if not exists listings_heat_idx on public.listings (heat_score desc) where status = 'published';

create or replace function public.refresh_heat(p_non_valley_weight numeric default 0.25)
returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  with v as (
    select listing_id,
      sum(case when is_local then 1 else p_non_valley_weight end) filter (where created_at > now() - interval '7 days') as v7,
      sum(case when is_local then 1 else p_non_valley_weight end) filter (where created_at <= now() - interval '7 days' and created_at > now() - interval '35 days') / 4.0 as vbase
    from public.vouches where voided_at is null and created_at > now() - interval '35 days'
    group by listing_id
  ), e as (
    select listing_id,
      count(*) filter (where kind <> 'view' and created_at > now() - interval '7 days') as c7,
      count(*) filter (where kind = 'view' and created_at > now() - interval '7 days') as w7,
      count(*) filter (where kind <> 'view' and created_at <= now() - interval '7 days') / 4.0 as cbase,
      count(*) filter (where kind = 'view' and created_at <= now() - interval '7 days') / 4.0 as wbase
    from public.events where created_at > now() - interval '35 days' and listing_id is not null
    group by listing_id
  ), s as (
    select l.id,
      coalesce(v.v7, 0) * 5 + coalesce(e.c7, 0) + coalesce(e.w7, 0) * 0.1 as momentum,
      coalesce(v.vbase, 0) * 5 + coalesce(e.cbase, 0) + coalesce(e.wbase, 0) * 0.1 as baseline,
      4 * greatest(0, 1 - extract(epoch from now() - coalesce(l.published_at, l.created_at)) / 86400 / 21) as newness
    from public.listings l
    left join v on v.listing_id = l.id
    left join e on e.listing_id = l.id
    where l.status = 'published'
  )
  update public.listings l
     set heat_score = round((s.momentum + greatest(s.momentum - s.baseline, 0) + s.newness)::numeric, 2),
         heat_updated_at = now()
    from s where s.id = l.id;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.refresh_heat(numeric) from public, anon, authenticated;
grant execute on function public.refresh_heat(numeric) to service_role;

-- heat_score is system-owned: add it to the owner guard.
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
       or new.published_at is distinct from old.published_at then
      raise exception 'protected field: submit an edit request instead'
        using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

-- ---------- Search ----------
-- Runs as the caller (RLS applies: anon only sees published). Searches name,
-- dishes, story, category names and area name, with typo-tolerant name match.
create or replace function public.search_listings(
  q text default null,
  p_type public.listing_type default null,
  p_category text default null,
  p_area text default null,
  p_open boolean default false,
  p_licensed boolean default false,
  p_max_price smallint default null,
  p_limit integer default 60
) returns table (id uuid, rank real)
language sql stable security invoker set search_path = '' as $$
  with docs as (
    select l.id, l.name,
      setweight(to_tsvector('english', l.name), 'A') ||
      setweight(to_tsvector('english',
        coalesce(l.what_to_order, '') || ' ' || coalesce(l.story_hook, '') || ' ' ||
        coalesce((select string_agg(c.name || ' ' || replace(c.slug, '-', ' '), ' ')
                  from public.listing_categories lc join public.categories c on c.id = lc.category_id
                  where lc.listing_id = l.id), '')), 'B') ||
      setweight(to_tsvector('english',
        coalesce(l.origin_story, '') || ' ' || coalesce((select a.name from public.areas a where a.id = l.area_id), '')), 'C') as doc
    from public.listings l
    where l.status = 'published'
      and (p_type is null or l.type = p_type)
      and (p_category is null or exists (
            select 1 from public.listing_categories lc join public.categories c on c.id = lc.category_id
            where lc.listing_id = l.id and c.slug = p_category))
      and (p_area is null or exists (select 1 from public.areas a where a.id = l.area_id and a.slug = p_area))
      and (not p_licensed or l.license_verified_at is not null)
      and (p_max_price is null or l.price_level is null or l.price_level <= p_max_price)
      and (not p_open or public.is_open_at(l.id))
  ), query as (
    select case when nullif(btrim(q), '') is null then null else websearch_to_tsquery('english', q) end as tsq
  )
  select d.id,
    (case when query.tsq is null then 0 else ts_rank(d.doc, query.tsq) end
      + case when nullif(btrim(q), '') is null then 0 else extensions.similarity(d.name, q) end)::real as rank
  from docs d, query
  where query.tsq is null
     or d.doc @@ query.tsq
     or extensions.similarity(d.name, q) > 0.3
     or d.name ilike '%' || btrim(q) || '%'
  order by rank desc, d.name
  limit greatest(1, least(p_limit, 200));
$$;
grant execute on function public.search_listings(text, public.listing_type, text, text, boolean, boolean, smallint, integer) to anon, authenticated;

-- Data fix from seed review: Vito's grew from a food truck.
update public.listings set growth_path = '[{"stage":"food_truck"},{"stage":"restaurant"}]'::jsonb where slug = 'vitos-tacos';

-- Seed the score once.
select public.refresh_heat();
