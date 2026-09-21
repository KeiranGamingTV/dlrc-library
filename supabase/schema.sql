-- DLRC Library database schema for Supabase/Postgres.
create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.submission_status as enum ('pending', 'rejected', 'approved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text not null unique,
  file_hash text not null,
  title text not null,
  artist text not null,
  album text,
  duration_ms integer,
  year integer,
  genre text,
  composer text,
  lyricist text,
  notes text,
  parsed_metadata jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'pending',
  verification_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.songs (
  id uuid primary key references public.submissions(id),
  title text not null,
  artist text not null,
  album text,
  duration_ms integer,
  year integer,
  genre text,
  composer text,
  lyricist text,
  dlrc_version text not null default '1.0',
  file_hash text not null unique,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index songs_title_idx on public.songs using gin (to_tsvector('simple', title));
create index songs_artist_idx on public.songs using gin (to_tsvector('simple', artist));
create index songs_album_idx on public.songs using gin (to_tsvector('simple', coalesce(album,'')));
create index submissions_user_idx on public.submissions(user_id, created_at desc);
create index submissions_status_idx on public.submissions(status, created_at asc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.songs enable row level security;

create policy "users can read their own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "users can read their own submissions" on public.submissions for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "authenticated users can submit" on public.submissions for insert to authenticated with check (user_id = auth.uid());
create policy "admins can update submissions" on public.submissions for update to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "public can read songs" on public.songs for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public) values ('submissions','submissions',false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('dlrc-files','dlrc-files',false) on conflict (id) do nothing;

-- Storage is accessed by the server with the service-role key. Do not expose that key to clients.
