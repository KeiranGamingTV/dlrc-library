# DLRC Library

A Vercel-ready searchable repository for verified Duet LRC (`.dlrc`) files.

## Stack

- Next.js 16 App Router
- TypeScript
- Supabase Auth + PostgreSQL + Storage
- Vercel deployment

## Current workflow

1. Anyone can search and download verified DLRC files without an account.
2. A signed-in user can upload a `.dlrc` file.
3. The browser parses the file and shows detected metadata before submission.
4. The server parses and validates the file again before accepting it.
5. The file is kept in private submission storage while it is pending.
6. An administrator reviews the file and either verifies or rejects it.
7. Verified files are copied into the repository and become public/searchable.

## DLRC parser

The parser currently supports the syntax demonstrated by the supplied sample:

- `[ti:]` title
- `[ar:]` artist
- `[al:]` album
- `[length:]` duration
- Arbitrary additional metadata tags
- Named color declarations such as `- [#000DFF: blue]`
- Speaker assignments such as `{1}`, `{2}`, and `{B}`
- Named lyric colors such as `<blue>`
- Direct hexadecimal lyric colors such as `<#FF8000>`
- Timestamped lyric lines such as `[00:10.15]{1}<blue> Lyrics`

The parser also detects speaker IDs, preserves metadata tags, reports warnings, validates timestamp order, and can infer a duration from the final lyric timestamp when `[length:]` is missing.

## Local setup

1. Install Node.js 20+.
2. Create a Supabase project.
3. In the Supabase SQL Editor, run `supabase/schema.sql`.
4. Configure Supabase email authentication and the confirmation email template so the confirmation URL points to `/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
5. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`
6. Run `npm install`.
7. Start with `npm run dev`.

## Make yourself the first admin

After creating your account, run this in Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Vercel

Import the Git repository into Vercel and add the same environment variables to the Production environment. Set `NEXT_PUBLIC_SITE_URL` to the production URL, then deploy.

## API

The first public API endpoints are:

- `GET /api/v1/search?q=...`
- `GET /api/v1/songs/:id`
- `GET /api/v1/download/:id`

The API intentionally exposes only verified songs. This gives AuralArc a stable integration point later.

## Important security notes

- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side and must never be exposed to browser code.
- Submitted files remain private until verification.
- Server-side parsing is required even though the browser previews the metadata.
- Exact file hashes are checked against both pending submissions and published songs.
- Public downloads are generated through short-lived signed storage URLs.
