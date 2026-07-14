create type public.payment_method as enum (
  'bank_transfer',
  'cash',
  'card',
  'other'
);

alter table public.renewals
  add column amount_received numeric(10, 2),
  add column currency text not null default 'ARS',
  add column payment_method public.payment_method,
  add column paid_at timestamp with time zone,
  add column external_reference text;

create index if not exists member_plans_status_due_idx
  on public.member_plans (status, next_payment_due_at);

create index if not exists renewals_renewed_at_idx
  on public.renewals (renewed_at desc);
