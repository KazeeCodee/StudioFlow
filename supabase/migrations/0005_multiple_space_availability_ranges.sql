-- Availability now stores active windows only; an absent weekday means closed.
delete from public.space_availability_rules
where is_active = false;

alter table public.space_availability_rules
  drop constraint if exists space_availability_rules_weekday_check,
  add constraint space_availability_rules_weekday_check
    check (day_of_week between 0 and 6),
  drop constraint if exists space_availability_rules_time_order_check,
  add constraint space_availability_rules_time_order_check
    check (start_time < end_time);

create index if not exists space_availability_rules_space_day_idx
  on public.space_availability_rules (space_id, day_of_week);
