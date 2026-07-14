create extension if not exists btree_gist with schema extensions;

alter table public.bookings
  add constraint bookings_no_active_overlap
  exclude using gist (
    space_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'confirmed'));

alter table public.bookings
  add constraint bookings_valid_window
  check (ends_at > starts_at);

alter table public.member_plans
  add constraint member_plans_valid_quota
  check (
    quota_total >= 0
    and quota_used >= 0
    and quota_remaining >= 0
    and quota_used + quota_remaining = quota_total
  );

update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ]::text[],
  updated_at = now()
where id = 'uploads';
