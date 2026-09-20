# DLRC Library

A Vercel-ready searchable repository for verified Duet LRC (`.dlrc`) files.

## Stack

- Next.js 16 App Router
- TypeScript
- Supabase Auth + PostgreSQL + Storage
- Vercel deployment

Supabase is used as the backend service so the Next.js application can remain stateless and deploy cleanly to Vercel.

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
6. Install packages with `npm install`.
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

## Current features

- Public search with no account required.
- Public verified-song pages.
- Public `.dlrc` downloads.
- Email/password account creation and sign-in.
- DLRC parser based on the supplied sample format.
- Client-side metadata preview before submission.
- Server-side validation before a submission is accepted.
- Private submission storage.
- Admin verification/rejection workflow.
- Verified files are copied to the public repository and become searchable only after approval.
- Initial `/api/v1` search, song, and download endpoints for future AuralArc integration.

## Important

The current parser implements the syntax demonstrated by `sample.dlrc`: `[ti:]`, `[ar:]`, `[al:]`, `[length:]`, named color declarations, `{speaker}` assignments, `<named-color>` / `<#RRGGBB>` colors, and timestamped lyric lines. The parser is deliberately isolated in `lib/dlrc/parser.ts` so additional DLRC syntax can be added without rewriting the site.
