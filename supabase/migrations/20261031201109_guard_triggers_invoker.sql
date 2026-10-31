-- Guard triggers must see the *caller's* role. Inside SECURITY DEFINER,
-- current_user is the function owner, which silently disabled the checks.
-- Run them as invoker; privileged internal writes (e.g. vouch counter refresh,
-- which is SECURITY DEFINER) still pass because current_user is then the owner.
alter function private.listings_guard() security invoker;
alter function private.profiles_guard() security invoker;
alter function private.vouches_before() security invoker;
