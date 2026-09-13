-- Prevent authenticated users from escalating profiles.role to 'admin'.
-- Service-role (server) updates still work for legitimate admin provisioning.
-- Run in Supabase SQL Editor (or via migration tooling).

create or replace function public.protect_profiles_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / server-side writes may change role (e.g. manual admin setup).
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'customer';
    return new;
  end if;

  if tg_op = 'UPDATE' and old.role is distinct from new.role then
    new.role := old.role;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profiles_role_trigger on public.profiles;

create trigger protect_profiles_role_trigger
  before insert or update on public.profiles
  for each row
  execute function public.protect_profiles_role();

comment on function public.protect_profiles_role() is
  'Blocks self-service role escalation; only service_role may set profiles.role.';
