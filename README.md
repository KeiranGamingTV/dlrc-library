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
