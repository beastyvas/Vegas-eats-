-- RLS / trigger regression test. Runs inside a transaction and ROLLS BACK,
-- so it is safe against any database. Any failed assertion raises.
-- Run:  psql "$DATABASE_URL" -f supabase/tests/rls_test.sql
--   or paste into the Supabase SQL editor.
begin;

do $$
declare
  v_admin uuid := gen_random_uuid();
  v_owner uuid := gen_random_uuid();
  v_local uuid := gen_random_uuid();
  v_tourist uuid := gen_random_uuid();
  v_unconfirmed uuid := gen_random_uuid();
  v_pub uuid; v_draft uuid; v_home uuid;
  n int; ok boolean;
  r record;
begin
  insert into public.admin_emails (email) values ('rls-admin@test.local');
  insert into auth.users (id, email, email_confirmed_at, created_at, aud, role) values
    (v_admin, 'rls-admin@test.local', now(), now() - interval '30 days', 'authenticated', 'authenticated'),
    (v_owner, 'owner@test.local', now(), now() - interval '30 days', 'authenticated', 'authenticated'),
    (v_local, 'local@test.local', now(), now() - interval '30 days', 'authenticated', 'authenticated'),
    (v_tourist, 'tourist@test.local', now(), now() - interval '30 days', 'authenticated', 'authenticated'),
    (v_unconfirmed, 'new@test.local', null, now(), 'authenticated', 'authenticated');

  -- profile trigger + admin bootstrap
  select role into r from public.profiles where id = v_admin;
  assert r.role = 'admin', 'whitelisted email should become admin';
  update public.profiles set zip = '89101' where id = v_local;
  update public.profiles set zip = '90210' where id = v_tourist;
  assert (select is_valley from public.profiles where id = v_local), 'valley zip should set is_valley';
  assert not (select is_valley from public.profiles where id = v_tourist), 'non-valley zip';

  insert into public.listings (slug, name, type, status, street_address, lat, lng)
    values ('rls-pub', 'RLS Pub', 'restaurant', 'published', '1 Main St', 36.1, -115.1) returning id into v_pub;
  insert into public.listings (slug, name, type, status) values ('rls-draft', 'RLS Draft', 'food_truck', 'draft') returning id into v_draft;
  -- home seller with an address: trigger must strip it
  insert into public.listings (slug, name, type, status, street_address, lat, lng, zip)
    values ('rls-home', 'RLS Home', 'home_seller', 'published', '123 Secret Ln', 36.2, -115.2, '89101') returning id into v_home;
  select * into r from public.listings where id = v_home;
  assert r.street_address is null and r.lat is null and r.zip is null, 'home seller address must be stripped';
  assert (select published_at is not null from public.listings where id = v_pub), 'published_at auto-set';

  insert into public.listing_owners (listing_id, user_id) values (v_pub, v_owner);
  insert into public.candidates (source, name, dedupe_key) values ('manual', 'Secret Candidate', 'secret');

  -- ---------------- anon ----------------
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.listings where slug like 'rls-%';
  assert n = 2, format('anon should see 2 published listings, saw %s', n);
  select count(*) into n from public.candidates;
  assert n = 0, 'anon must not see candidates';
  select count(*) into n from public.areas;
  assert n > 0, 'anon can read areas';
  reset role;

  -- ---------------- owner ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.listings set what_to_order = 'Brisket' where id = v_pub;
  get diagnostics n = row_count;
  assert n = 1, 'owner can edit allowed fields';
  begin
    update public.listings set name = 'Renamed' where id = v_pub;
    raise exception 'owner renamed listing (should be blocked)';
  exception when insufficient_privilege then null;
  end;
  update public.listings set what_to_order = 'Hack' where id = v_home;
  get diagnostics n = row_count;
  assert n = 0, 'non-owner cannot edit another listing';
  select count(*) into n from public.listings where id = v_draft;
  assert n = 0, 'owner cannot see unrelated draft';
  insert into public.checkins (listing_id, posted_by, location_name, ends_at)
    values (v_pub, v_owner, 'Lot on Main', now() + interval '3 hours');
  begin
    insert into public.checkins (listing_id, posted_by, location_name, ends_at)
      values (v_home, v_owner, 'Not mine', now() + interval '3 hours');
    raise exception 'owner checked in for a listing they do not own';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- ---------------- local user ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_local, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.vouches (listing_id, user_id, note) values (v_pub, v_local, 'Get the brisket');
  begin
    insert into public.vouches (listing_id, user_id) values (v_pub, v_local);
    raise exception 'double vouch allowed';
  exception when unique_violation then null;
  end;
  begin
    insert into public.vouches (listing_id, user_id) values (v_draft, v_local);
    raise exception 'vouch on draft allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'admin' where id = v_local;
    raise exception 'user self-promoted to admin';
  exception when insufficient_privilege then null;
  end;
  select count(*) into n from public.candidates;
  assert n = 0, 'user must not see candidates';
  reset role;

  -- ---------------- tourist (non-valley) ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_tourist, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.vouches (listing_id, user_id) values (v_pub, v_tourist);
  -- tourist cannot read the local's vouch row
  select count(*) into n from public.vouches where user_id = v_local;
  assert n = 0, 'vouch rows are private';
  reset role;

  select vouch_local_count, vouch_total_count into r from public.listings where id = v_pub;
  assert r.vouch_local_count = 1 and r.vouch_total_count = 2,
    format('vouch counts wrong: local=%s total=%s', r.vouch_local_count, r.vouch_total_count);

  -- ---------------- unconfirmed email ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_unconfirmed, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.vouches (listing_id, user_id) values (v_pub, v_unconfirmed);
    raise exception 'unconfirmed email vouched';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- ---------------- admin ----------------
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.candidates where name = 'Secret Candidate';
  assert n = 1, 'admin can see candidates';
  select count(*) into n from public.listings where id = v_draft;
  assert n = 1, 'admin sees drafts';
  update public.vouches set voided_at = now(), voided_by = v_admin where user_id = v_tourist;
  reset role;
  select vouch_total_count into n from public.listings where id = v_pub;
  assert n = 1, 'voided vouch excluded from counts';

  raise notice 'ALL RLS TESTS PASSED';
end $$;

rollback;
