-- =============================================================================
-- Row Level Security. Model:
--   * public (anon + authenticated) reads reference data and PUBLISHED listings
--   * owners read/write their own listing + children (protected fields guarded
--     by listings_guard trigger)
--   * admins read/write everything
--   * service_role (server-only: cron, beacon, seed import) bypasses RLS
-- =============================================================================

-- Enable RLS everywhere
do $$
declare t text;
begin
  foreach t in array array[
    'areas','categories','valley_zips','profiles','admin_emails','listings',
    'listing_categories','listing_owners','listing_hours','listing_photos',
    'listing_socials','schedules','checkins','vouches','claims','claim_codes',
    'edit_requests','license_verifications','agent_runs','agent_jobs',
    'candidates','chain_checks','suggestions','flags','outreach','events',
    'listing_stats_daily','searches','subscriptions','app_settings'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------- Reference data: public read, admin write ----------
create policy areas_read on public.areas for select using (true);
create policy areas_admin on public.areas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy categories_read on public.categories for select using (true);
create policy categories_admin on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy valley_zips_read on public.valley_zips for select using (true);
create policy valley_zips_admin on public.valley_zips for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy app_settings_read on public.app_settings for select using (true);
create policy app_settings_admin on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Profiles ----------
create policy profiles_self_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy admin_emails_admin on public.admin_emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Listings ----------
create policy listings_read on public.listings for select
  using (status = 'published' or public.can_edit_listing(id));
create policy listings_admin_insert on public.listings for insert to authenticated
  with check (public.is_admin());
create policy listings_edit on public.listings for update to authenticated
  using (public.can_edit_listing(id)) with check (public.can_edit_listing(id));
create policy listings_admin_delete on public.listings for delete to authenticated
  using (public.is_admin());

-- Listing children: visible when the parent is visible; editable by owner/admin.
do $$
declare t text;
begin
  foreach t in array array['listing_categories','listing_hours','listing_photos','listing_socials','schedules'] loop
    execute format($f$create policy %1$s_read on public.%1$I for select using (public.can_view_listing(listing_id))$f$, t);
    execute format($f$create policy %1$s_insert on public.%1$I for insert to authenticated with check (public.can_edit_listing(listing_id))$f$, t);
    execute format($f$create policy %1$s_update on public.%1$I for update to authenticated using (public.can_edit_listing(listing_id)) with check (public.can_edit_listing(listing_id))$f$, t);
    execute format($f$create policy %1$s_delete on public.%1$I for delete to authenticated using (public.can_edit_listing(listing_id))$f$, t);
  end loop;
end $$;

create policy checkins_read on public.checkins for select
  using (public.can_view_listing(listing_id));
create policy checkins_insert on public.checkins for insert to authenticated
  with check (public.can_edit_listing(listing_id) and posted_by = (select auth.uid()));
create policy checkins_update on public.checkins for update to authenticated
  using (public.can_edit_listing(listing_id)) with check (public.can_edit_listing(listing_id));
create policy checkins_delete on public.checkins for delete to authenticated
  using (public.can_edit_listing(listing_id));

create policy listing_owners_read on public.listing_owners for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy listing_owners_admin on public.listing_owners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Vouches ----------
-- Individual rows are private (own + admin). Public counts are denormalised on
-- listings; public notes/rankings come from security-definer functions.
create policy vouches_read on public.vouches for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy vouches_insert on public.vouches for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_vouch(listing_id));
create policy vouches_update_own_note on public.vouches for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());
create policy vouches_delete on public.vouches for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- ---------- Claims / edits / licenses ----------
create policy claims_read on public.claims for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy claims_insert on public.claims for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending'
              and exists (select 1 from public.listings l where l.id = listing_id and l.status = 'published'));
create policy claims_admin on public.claims for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy claim_codes_admin on public.claim_codes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy edit_requests_read on public.edit_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy edit_requests_insert on public.edit_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and public.owns_listing(listing_id));
create policy edit_requests_admin on public.edit_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy license_read on public.license_verifications for select to authenticated
  using (submitted_by = (select auth.uid()) or public.is_admin());
create policy license_insert on public.license_verifications for insert to authenticated
  with check (submitted_by = (select auth.uid()) and status = 'pending' and public.owns_listing(listing_id));
create policy license_admin on public.license_verifications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Admin-only workflow tables ----------
do $$
declare t text;
begin
  foreach t in array array['agent_runs','agent_jobs','candidates','chain_checks','suggestions','flags','outreach','searches','events','subscriptions'] loop
    execute format($f$create policy %1$s_admin on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())$f$, t);
  end loop;
end $$;

-- Users may file reports (flags of kind 'report') about published listings.
create policy flags_user_report on public.flags for insert to authenticated
  with check (kind = 'report' and created_by = (select auth.uid()) and status = 'open'
              and listing_id is not null and public.can_view_listing(listing_id));

-- Owners can read their own subscription & stats.
create policy subscriptions_owner_read on public.subscriptions for select to authenticated
  using (public.owns_listing(listing_id));
create policy stats_read on public.listing_stats_daily for select to authenticated
  using (public.can_edit_listing(listing_id));
