import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Reference · DLRC Library',
  description:
    'API reference for searching, retrieving, and downloading verified DLRC files.',
};

export const dynamic = 'force-dynamic';

export default function ApiPage() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://dlrc-library.vercel.app'
  ).replace(/\/+$/, '');

  const apiBase = `${baseUrl}/api/v1`;

  return (
    <main className="section">
      <div className="container">
        <h1 className="title">DLRC Library API</h1>

        <p className="subtitle">
          A public, read-only API for discovering verified lyrics
          and retrieving Duet LRC files for music players and other
          applications.
        </p>

        <div className="api-docs">
          <section className="card">
            <h2>Base URL</h2>

            <pre className="api-code">{apiBase}</pre>

            <p className="small" style={{ marginTop: 12 }}>
              API version: 1. All endpoints use HTTPS in production.
              Public read endpoints do not require an API key.
            </p>

            <div className="actions" style={{ marginTop: 16 }}>
              <a
                className="btn btn-primary"
                href={`${apiBase}/health`}
                target="_blank"
                rel="noreferrer"
              >
                Check API health
              </a>

              <a
                className="btn"
                href={`${apiBase}/openapi.json`}
                target="_blank"
                rel="noreferrer"
              >
                OpenAPI JSON
              </a>
            </div>
          </section>

          <section>
            <h2>Endpoints</h2>

            <div className="api-endpoint">
              <div className="api-method">GET</div>
              <code>/health</code>

              <p>
                Returns a basic health response and API version.
              </p>

              <pre className="api-code">
                {`curl "${apiBase}/health"`}
              </pre>

              <pre className="api-code" style={{ marginTop: 10 }}>
                {`{
  "ok": true,
  "api": "dlrc-library",
  "version": "1"
}`}
              </pre>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>
              <code>/search</code>

              <p>
                Searches published songs by query, with optional
                artist, album, year, sorting, and pagination filters.
                The <code>q</code> parameter is required.
              </p>

              <div className="api-rate-table">
                <div>
                  <strong>q</strong>
                  <span>
                    Required. Search query, up to 200 characters.
                  </span>
                </div>

                <div>
                  <strong>artist</strong>
                  <span>Optional artist filter, up to 200 characters.</span>
                </div>

                <div>
                  <strong>album</strong>
                  <span>Optional album filter, up to 200 characters.</span>
                </div>

                <div>
                  <strong>year</strong>
                  <span>
                    Optional integer from 1 to 9999.
                  </span>
                </div>

                <div>
                  <strong>sort</strong>
                  <span>
                    Optional: relevance, title, artist, or year.
                    Defaults to relevance.
                  </span>
                </div>

                <div>
                  <strong>limit</strong>
                  <span>
                    Optional integer from 1 to 100. Defaults to 25.
                  </span>
                </div>

                <div>
                  <strong>offset</strong>
                  <span>
                    Optional integer from 0 to 100000. Defaults to 0.
                  </span>
                </div>
              </div>

              <pre className="api-code" style={{ marginTop: 14 }}>
                {`curl -G "${apiBase}/search" \\
  --data-urlencode "q=underworld" \\
  --data-urlencode "artist=Example Artist" \\
  --data-urlencode "limit=25"`}
              </pre>

              <p>
                The JSON response contains a <code>data</code> array
                and a <code>meta</code> object. Metadata includes the
                result count, total matches, limit, offset, and
                <code> has_more</code> pagination flag.
              </p>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>
              <code>/songs/{'{id}'}</code>

              <p>
                Returns metadata for a published song, including its
                title, artist, album, duration, year, genre, composer,
                lyricist, DLRC version, and related endpoints.
              </p>

              <pre className="api-code" style={{ marginTop: 14 }}>
                {`curl "${apiBase}/songs/SONG_ID"`}
              </pre>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>
              <code>/songs/{'{id}'}/dlrc</code>

              <p>
                Returns the raw DLRC file as
                <code> text/plain; charset=utf-8</code>. Use this
                endpoint when the application needs to read or cache
                the lyrics.
              </p>

              <pre className="api-code" style={{ marginTop: 14 }}>
                {`curl "${apiBase}/songs/SONG_ID/dlrc"`}
              </pre>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>
              <code>/download/{'{id}'}</code>

              <p>
                Downloads a published DLRC file with an attachment
                filename. Use this endpoint when the user explicitly
                wants to download the file.
              </p>

              <pre className="api-code" style={{ marginTop: 14 }}>
                {`curl -L "${apiBase}/download/SONG_ID" \\
  -o lyrics.dlrc`}
              </pre>
            </div>
          </section>

          <section className="card">
            <h2>Search response</h2>

            <p className="small">
              Example structure. Values shown here are illustrative;
              actual results depend on the library.
            </p>

            <pre className="api-code">
              {`{
  "data": [
    {
      "id": "SONG_ID",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration_ms": 222000,
      "duration": "3:42",
      "year": 2025,
      "genre": null,
      "composer": null,
      "lyricist": null,
      "dlrc_version": "1.0",
      "endpoints": {
        "song": "/api/v1/songs/SONG_ID",
        "dlrc": "/api/v1/songs/SONG_ID/dlrc",
        "download": "/api/v1/download/SONG_ID"
      }
    }
  ],
  "meta": {
    "query": "Song Title",
    "artist": null,
    "album": null,
    "year": null,
    "sort": "relevance",
    "count": 1,
    "total": 1,
    "limit": 25,
    "offset": 0,
    "has_more": false
  }
}`}
            </pre>
          </section>

          <section>
            <h2>Errors and status codes</h2>

            <div className="api-rate-table">
              <div>
                <strong>400 — Bad Request</strong>
                <span>
                  Missing or invalid search parameters.
                </span>
              </div>

              <div>
                <strong>404 — Not Found</strong>
                <span>
                  The requested song does not exist in the published
                  library.
                </span>
              </div>

              <div>
                <strong>429 — Too Many Requests</strong>
                <span>
                  The rate limit was exceeded. Check
                  <code> Retry-After</code> before retrying.
                </span>
              </div>

              <div>
                <strong>5xx — Server Error</strong>
                <span>
                  The request could not be completed because of a
                  server-side problem. Retry with backoff.
                </span>
              </div>

              <div>
                <strong>304 — Not Modified</strong>
                <span>
                  For supported metadata and DLRC requests, the
                  cached resource has not changed.
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Rate limits</h2>

            <p className="small">
              Limits are applied per client IP in one-minute windows.
              No API key is required for these public read endpoints.
            </p>

            <div className="api-rate-table">
              <div>
                <strong>Search</strong>
                <span>60 requests per minute</span>
              </div>

              <div>
                <strong>Song metadata</strong>
                <span>120 requests per minute</span>
              </div>

              <div>
                <strong>DLRC retrieval and download</strong>
                <span>120 requests per minute</span>
              </div>
            </div>

            <p className="small" style={{ marginTop: 12 }}>
              When rate-limited, wait for the number of seconds
              indicated by <code>Retry-After</code>. Avoid retrying
              continuously.
            </p>
          </section>

          <section>
            <h2>CORS and caching</h2>

            <p>
              Public read endpoints allow cross-origin requests, making
              them usable by websites and applications such as AuralArc.
              No authenticated write endpoints are exposed through this
              public API.
            </p>

            <p>
              Song metadata and raw DLRC retrieval support ETags.
              Clients can store an ETag and send it in an
              <code> If-None-Match</code> request header to avoid
              downloading unchanged content. A <code>304</code> response
              means the cached content can be reused.
            </p>

            <p>
              Respect response caching headers. Cache results locally
              when appropriate instead of repeatedly searching for the
              same song.
            </p>
          </section>

          <section className="card" id="auralarc">
            <h2>AuralArc integration</h2>

            <p>
              AuralArc can use DLRC Library as a remote source for
              verified, time-synchronized lyrics. The same API is
              available to other music players.
            </p>

            <h3>Recommended lookup flow</h3>

            <ol>
              <li>
                Read the current track's title, artist, and duration
                from the music library.
              </li>
              <li>
                Search using the title and optionally narrow the
                results with artist and album filters.
              </li>
              <li>
                Compare the returned title, artist, and duration with
                the current track. Prefer a strong metadata match
                instead of automatically selecting the first result.
              </li>
              <li>
                Retrieve the raw DLRC text from the selected result's
                <code> endpoints.dlrc</code> URL.
              </li>
              <li>
                Parse the file using the player's DLRC parser and
                display synchronized lyrics and singer information
                according to the format supported by the player.
              </li>
              <li>
                Cache the content and its ETag where possible. If the
                network is unavailable, continue using a valid local
                lyrics file or cached result.
              </li>
            </ol>

            <h3>Search and retrieve lyrics</h3>

            <pre className="api-code">
              {`# 1. Search for the track
curl -G "${apiBase}/search" \\
  --data-urlencode "q=Song Title" \\
  --data-urlencode "artist=Artist Name"

# 2. Retrieve the matching result's DLRC
curl "${apiBase}/songs/SONG_ID/dlrc"`}
            </pre>

            <p className="small">
              Replace the example title, artist, and song ID with
              values from the player's current track and the search
              response. The search response provides the exact
              endpoint paths for each result.
            </p>

            <h3>Integration recommendations</h3>

            <ul>
              <li>
                Do not perform network searches continuously during
                playback; search when a track changes or when the user
                requests remote lyrics.
              </li>
              <li>
                Use title, artist, and duration together to reduce
                incorrect matches, especially for live versions,
                remixes, and songs with identical names.
              </li>
              <li>
                Treat a missing result as a normal outcome. Keep local
                lyrics and other configured sources available.
              </li>
              <li>
                Apply timeouts, bounded retries, and backoff for
                transient failures and rate limiting.
              </li>
              <li>
                Never include Supabase service-role credentials or
                private server secrets in the Android application.
              </li>
            </ul>
          </section>

          <section className="card">
            <h2>OpenAPI specification</h2>

            <p>
              The machine-readable OpenAPI 3.1 specification describes
              the public API endpoints and response types. It can be
              used by compatible API clients and documentation tools.
            </p>

            <a
              className="btn btn-primary"
              href={`${apiBase}/openapi.json`}
              target="_blank"
              rel="noreferrer"
            >
              View OpenAPI specification
            </a>
          </section>

          <section className="browse-search-cta">
            <h2>Explore the DLRC Library</h2>

            <p>
              Search the published collection or contribute verified
              lyrics to help make synchronized duet lyrics available
              to more music players.
            </p>

            <div className="actions" style={{ justifyContent: 'center' }}>
              <Link className="btn btn-primary" href="/search">
                Search songs
              </Link>

              <Link className="btn" href="/submit">
                Submit a DLRC
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
