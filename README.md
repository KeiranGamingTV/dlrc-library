<p align="center">
  <img src="public/logo.png" alt="DLRC Library logo" width="140" />
</p>

<h1 align="center">DLRC Library</h1>

<p align="center">
  <strong>A web platform to search, discover, and download verified Duet LRC (.dlrc) files.</strong><br />
  Built for community-driven lyric sharing, public catalog discovery, and seamless user submissions.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Deployment-Vercel-000000?logo=vercel&logoColor=white" />
  <img alt="Status" src="https://img.shields.io/badge/status-active%20development-orange" />
  <img alt="License" src="https://img.shields.io/badge/license-TBD-lightgrey" />
</p>

<p align="center">
  <strong>- - - Like my work? ❤️ - - -</strong><br />
  <strong><a href="https://ko-fi.com/therealkdude">Buy me a coffee on Ko-fi</a></strong><br />
</p>

> [!NOTE]
> DLRC Library is under active development. Features, layouts, review workflows, and internal API routes may change as the project evolves.

---

## About DLRC Library

DLRC Library is a central repository designed to host and organize verified **Duet LRC (`.dlrc`)** lyric files for duet-aware media players like **AuralArc**.

The platform allows anyone to freely search and download lyrics without needing an account, while authenticated users can upload new `.dlrc` files for moderation. Incoming files undergo browser-side parsing and server validation, remaining in private storage until an administrator reviews and approves them for public discovery.

> [!IMPORTANT]
> DLRC Library enforces strict validation on uploads. Uploaded files must include both a title (`[ti:]`) and artist (`[ar:]`) tag, use valid timestamp ordering, and follow standard DLRC color syntax.

---

## Current Workflow

| Step | Stage | Action |
| --- | --- | --- |
| **1** | Public Access | Anyone can search, preview, and download verified `.dlrc` files without an account. |
| **2** | Upload | Signed-in users select and submit a `.dlrc` file. |
| **3** | Client Parsing | The browser parses the file client-side and previews detected metadata before submission. |
| **4** | Server Validation | The server re-parses and validates standard formatting and structure before accepting the file. |
| **5** | Staging | Accepted files are held in private submission storage in a pending state. |
| **6** | Moderation | An administrator reviews pending submissions to verify accuracy or reject invalid files. |
| **7** | Publication | Verified files are moved into the public repository and indexed for global search. |

---

## Features & Parser Capabilities

### Comprehensive Tag Parsing
* Full support for standard metadata tags:
  * Title (`[ti:]`)
  * Artist (`[ar:]`)
  * Album (`[al:]`)
  * Duration (`[length:]`)
* Preserves arbitrary custom metadata tags without stripping context.
* Automatic duration inference from the final lyric timestamp when `[length:]` is omitted.

### Speaker Assignments & Color Syntax
* Parses speaker identifiers: `{1}` (Singer 1 / Left), `{2}` (Singer 2 / Right), and `{B}` (Both / Center).
* Named color declarations (e.g., `- [#000DFF: blue]`).
* Custom singer label definitions (e.g., `- [#000DFF: s1]` to represent Singer 1).
* Named color lyric tags (`<blue>`, `<s1>`).
* Direct inline hex lyric colors (e.g., `<#FF8000>`).
* Fully timestamped duet lines (e.g., `[00:10.15]{1}<blue> Lyrics`).

### Validation & Diagnostics
* Validates strict chronological timestamp ordering.
* Flags malformed hex codes and invalid column assignments.
* Reports detailed syntax warnings during pre-flight upload checks.

---

## Tech Stack

| Component | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Backend & Auth | Supabase (Auth, PostgreSQL, Object Storage) |
| Hosting | Vercel |

---

## Related Projects

* [Duet-LRC-Lyric-File](https://github.com/KeiranGamingTV/Duet-LRC-Lyric-File): Official DLRC format specification.
* [DLRC Creator](https://dlrc-creator.vercel.app): Web tool for creating and synchronizing DLRC files.
* [AuralArc](https://github.com/KeiranGamingTV/AuralArc): Android music player supporting DLRC duet lyrics.

---

## Contributing

Bug reports, suggestions, and pull requests are welcome through GitHub issues.

---

## License

A license has not been chosen yet.

---

<p align="center">
  <strong>DLRC Library</strong><br />
  Discover. Verify. Synchronize.
</p>
