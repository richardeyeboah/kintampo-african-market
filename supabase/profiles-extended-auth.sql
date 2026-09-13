-- ============================================================
-- Extended profile fields + handle_new_user() for signup metadata
-- Run in Supabase SQL Editor after auth-profiles.sql (safe to re-run).
--
-- Signup sends user metadata: first_name, last_name, full_name, phone,
-- marketing_opt_in, terms_accepted_at.
-- ============================================================

alter table public.profiles add column if not exists marketing_email_opt_in boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text := coalesce(nullif(trim(new.raw_user_meta_data->>'first_name'), ''), '');
  ln text := coalesce(nullif(trim(new.raw_user_meta_data->>'last_name'), ''), '');
  combined text;
  marketing boolean;
  terms_ts timestamptz;
begin
  combined := nullif(trim(concat_ws(' ', fn, ln)), '');
  if combined is null then
    combined := nullif(trim(coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    )), '');
  end if;

  marketing := lower(coalesce(new.raw_user_meta_data->>'marketing_opt_in', '')) in ('true', 't', '1');

  begin
    if new.raw_user_meta_data->>'terms_accepted_at' is not null
       and btrim(new.raw_user_meta_data->>'terms_accepted_at') <> '' then
      terms_ts := (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz;
    else
      terms_ts := null;
    end if;
  exception when others then
    terms_ts := null;
  end;

  insert into public.profiles (id, full_name, phone, role, marketing_email_opt_in, terms_accepted_at)
  values (
    new.id,
    coalesce(combined, ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    'customer',
    marketing,
    terms_ts
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on column public.profiles.marketing_email_opt_in is 'Optional marketing opt-in from signup (not pre-checked by default in app).';
comment on column public.profiles.terms_accepted_at is 'Timestamp when user accepted Terms/Privacy during signup, if provided.';
