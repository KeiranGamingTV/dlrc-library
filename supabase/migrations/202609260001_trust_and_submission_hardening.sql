alter table public.submissions
  add column if not exists song_key text,
  add column if not exists resubmission_of uuid references public.submissions(id) on delete set null,
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists validation_warnings jsonb not null default '[]'::jsonb;

alter table public.songs
  add column if not exists song_key text,
  add column if not exists content text;

create index if not exists submissions_song_key_idx on public.submissions(song_key);
create index if not exists submissions_resubmission_of_idx on public.submissions(resubmission_of);
create index if not exists songs_song_key_idx on public.songs(song_key);

create or replace function public.normalize_song_part(value text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(regexp_replace(lower(coalesce(value, '')), '[^[:alnum:]]+', ' ', 'g'), '\s+', ' ', 'g'));
$$;

update public.songs
set song_key = concat(public.normalize_song_part(title), '|', public.normalize_song_part(artist), '|', coalesce(round(duration_ms / 1000.0)::integer::text, ''))
where song_key is null;

update public.submissions
set song_key = concat(public.normalize_song_part(title), '|', public.normalize_song_part(artist), '|', coalesce(round(duration_ms / 1000.0)::integer::text, ''))
where song_key is null;
