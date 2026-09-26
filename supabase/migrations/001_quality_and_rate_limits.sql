alter table public.submissions
  add column if not exists song_key text,
  add column if not exists resubmission_of uuid references public.submissions(id) on delete set null,
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists validation_warnings jsonb not null default '[]'::jsonb;

alter table public.songs
  add column if not exists song_key text;

alter table public.songs
  add column if not exists content text;

create index if not exists submissions_song_key_idx
  on public.submissions(song_key);

create index if not exists submissions_resubmission_of_idx
  on public.submissions(resubmission_of);

create index if not exists songs_song_key_idx
  on public.songs(song_key);

create table if not exists public.api_rate_limits (
  bucket text not null,
  client_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),

  primary key (bucket, client_key, window_start)
);

create index if not exists api_rate_limits_created_at_idx
  on public.api_rate_limits(created_at);

alter table public.api_rate_limits enable row level security;

revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.check_api_rate_limit(
  p_bucket text,
  p_client_key text,
  p_window_start timestamptz,
  p_limit integer
)
returns table (
  allowed boolean,
  request_count integer,
  retry_after integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_window_end timestamptz;
begin
  insert into public.api_rate_limits (
    bucket,
    client_key,
    window_start,
    request_count
  )
  values (
    p_bucket,
    p_client_key,
    p_window_start,
    1
  )
  on conflict (bucket, client_key, window_start)
  do update
  set request_count =
    public.api_rate_limits.request_count + 1
  returning request_count
  into v_count;

  v_window_end :=
    p_window_start + interval '1 minute';

  return query
  select
    v_count <= p_limit,
    v_count,
    greatest(
      1,
      ceil(
        extract(
          epoch from (
            v_window_end - now()
          )
        )
      )::integer
    );
end;
$$;

revoke all
on function public.check_api_rate_limit(
  text,
  text,
  timestamptz,
  integer
)
from public;

grant execute
on function public.check_api_rate_limit(
  text,
  text,
  timestamptz,
  integer
)
to service_role;

create or replace function public.normalize_song_part(value text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(coalesce(value, '')),
        '[^[:alnum:]]+',
        ' ',
        'g'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

update public.songs
set song_key = concat(
  public.normalize_song_part(title),
  '|',
  public.normalize_song_part(artist),
  '|',
  coalesce(
    round(duration_ms / 1000.0)::integer::text,
    ''
  )
)
where song_key is null;

update public.submissions
set song_key = concat(
  public.normalize_song_part(title),
  '|',
  public.normalize_song_part(artist),
  '|',
  coalesce(
    round(duration_ms / 1000.0)::integer::text,
    ''
  )
)
where song_key is null;
