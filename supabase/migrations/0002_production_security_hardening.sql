create schema if not exists private;

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

create or replace function private.current_profile_role()
returns public.role
language sql
stable
security definer
set search_path = public
as $$
  select profiles.role
  from public.profiles
  where profiles.id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select private.current_profile_role()) in ('super_admin', 'admin'),
    false
  );
$$;

create or replace function private.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select private.current_profile_role()) in ('super_admin', 'admin', 'operator'),
    false
  );
$$;

create or replace function private.owns_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select auth.uid()) = target_profile_id, false);
$$;

create or replace function private.owns_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where members.id = target_member_id
      and members.profile_id = (select auth.uid())
  );
$$;

create or replace function private.owns_member_plan(target_member_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.member_plans
    inner join public.members on members.id = member_plans.member_id
    where member_plans.id = target_member_plan_id
      and members.profile_id = (select auth.uid())
  );
$$;

create or replace function private.owns_booking(target_booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings
    inner join public.members on members.id = bookings.member_id
    where bookings.id = target_booking_id
      and members.profile_id = (select auth.uid())
  );
$$;

grant execute on function private.current_profile_role() to authenticated;
grant execute on function private.is_admin_user() to authenticated;
grant execute on function private.is_staff_user() to authenticated;
grant execute on function private.owns_profile(uuid) to authenticated;
grant execute on function private.owns_member(uuid) to authenticated;
grant execute on function private.owns_member_plan(uuid) to authenticated;
grant execute on function private.owns_booking(uuid) to authenticated;

create index if not exists bookings_member_id_idx on public.bookings (member_id);
create index if not exists booking_status_history_booking_id_idx on public.booking_status_history (booking_id);
create index if not exists member_plans_member_id_idx on public.member_plans (member_id);

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.member_plans enable row level security;
alter table public.plans enable row level security;
alter table public.spaces enable row level security;
alter table public.space_availability_rules enable row level security;
alter table public.space_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_status_history enable row level security;
alter table public.renewals enable row level security;
alter table public.system_settings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists profiles_select_self_or_staff on public.profiles;
create policy profiles_select_self_or_staff
on public.profiles
for select
to authenticated
using (
  (select private.is_staff_user())
  or (select private.owns_profile(id))
);

drop policy if exists profiles_update_self_or_staff on public.profiles;
create policy profiles_update_self_or_staff
on public.profiles
for update
to authenticated
using (
  (select private.is_staff_user())
  or (select private.owns_profile(id))
)
with check (
  (select private.is_staff_user())
  or (select private.owns_profile(id))
);

drop policy if exists members_select_own_or_staff on public.members;
create policy members_select_own_or_staff
on public.members
for select
to authenticated
using (
  (select private.is_staff_user())
  or (select private.owns_member(id))
);

drop policy if exists members_write_admin_only on public.members;
create policy members_write_admin_only
on public.members
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists member_plans_select_own_or_staff on public.member_plans;
create policy member_plans_select_own_or_staff
on public.member_plans
for select
to authenticated
using (
  (select private.is_staff_user())
  or (select private.owns_member_plan(id))
);

drop policy if exists member_plans_write_admin_only on public.member_plans;
create policy member_plans_write_admin_only
on public.member_plans
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists plans_select_active_or_staff on public.plans;
create policy plans_select_active_or_staff
on public.plans
for select
to authenticated
using (
  (select private.is_staff_user())
  or status = 'active'
);

drop policy if exists plans_write_admin_only on public.plans;
create policy plans_write_admin_only
on public.plans
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists spaces_select_active_or_staff on public.spaces;
create policy spaces_select_active_or_staff
on public.spaces
for select
to authenticated
using (
  (select private.is_staff_user())
  or status = 'active'
);

drop policy if exists spaces_write_admin_only on public.spaces;
create policy spaces_write_admin_only
on public.spaces
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists space_availability_rules_select_active_spaces_or_staff on public.space_availability_rules;
create policy space_availability_rules_select_active_spaces_or_staff
on public.space_availability_rules
for select
to authenticated
using (
  (select private.is_staff_user())
  or space_id in (
    select spaces.id
    from public.spaces
    where spaces.status = 'active'
  )
);

drop policy if exists space_availability_rules_write_admin_only on public.space_availability_rules;
create policy space_availability_rules_write_admin_only
on public.space_availability_rules
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists space_blocks_select_staff_only on public.space_blocks;
create policy space_blocks_select_staff_only
on public.space_blocks
for select
to authenticated
using ((select private.is_staff_user()));

drop policy if exists space_blocks_write_admin_only on public.space_blocks;
create policy space_blocks_write_admin_only
on public.space_blocks
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists bookings_select_own_or_staff on public.bookings;
create policy bookings_select_own_or_staff
on public.bookings
for select
to authenticated
using (
  (select private.is_staff_user())
  or (select private.owns_booking(id))
);

drop policy if exists booking_status_history_select_own_or_staff on public.booking_status_history;
create policy booking_status_history_select_own_or_staff
on public.booking_status_history
for select
to authenticated
using (
  (select private.is_staff_user())
  or (select private.owns_booking(booking_id))
);

drop policy if exists renewals_select_admin_only on public.renewals;
create policy renewals_select_admin_only
on public.renewals
for select
to authenticated
using ((select private.is_admin_user()));

drop policy if exists renewals_write_admin_only on public.renewals;
create policy renewals_write_admin_only
on public.renewals
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists system_settings_admin_only on public.system_settings;
create policy system_settings_admin_only
on public.system_settings
for all
to authenticated
using ((select private.is_admin_user()))
with check ((select private.is_admin_user()));

drop policy if exists audit_logs_admin_only on public.audit_logs;
create policy audit_logs_admin_only
on public.audit_logs
for select
to authenticated
using ((select private.is_admin_user()));

drop policy if exists notification_deliveries_admin_only on public.notification_deliveries;
create policy notification_deliveries_admin_only
on public.notification_deliveries
for select
to authenticated
using ((select private.is_admin_user()));

grant select on public.profiles to authenticated;
grant select on public.members to authenticated;
grant select on public.member_plans to authenticated;
grant select on public.plans to authenticated;
grant select on public.spaces to authenticated;
grant select on public.space_availability_rules to authenticated;
grant select on public.space_blocks to authenticated;
grant select on public.bookings to authenticated;
grant select on public.booking_status_history to authenticated;
grant select on public.renewals to authenticated;
grant select on public.system_settings to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.notification_deliveries to authenticated;

grant insert, update, delete on public.members to authenticated;
grant insert, update, delete on public.member_plans to authenticated;
grant insert, update, delete on public.plans to authenticated;
grant insert, update, delete on public.spaces to authenticated;
grant insert, update, delete on public.space_availability_rules to authenticated;
grant insert, update, delete on public.space_blocks to authenticated;
grant insert, update, delete on public.renewals to authenticated;
grant insert, update, delete on public.system_settings to authenticated;

revoke insert, delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, phone, updated_at) on public.profiles to authenticated;

comment on schema private is
  'Security helpers used by RLS policies. Keep this schema out of exposed API access.';

comment on table public.profiles is
  'RLS enabled. Direct server-side privileged connections still need their own role hardening strategy outside PostgREST.';
