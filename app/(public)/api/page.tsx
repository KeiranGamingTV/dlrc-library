import Link from 'next/link';

export const metadata = {
  title: 'DLRC Library API',
  description:
    'Public API for searching and retrieving verified DLRC files.',
};

export default function ApiPage() {
  return (
    <main className="section">
      <div className="container">
        <h1 className="title">DLRC Library API</h1>

        <p className="subtitle">
          A public, read-only API for searching verified Duet
          LRC files and retrieving their contents.
        </p>

        <div className="api-docs">
          <section className="card">
            <h2>Base URL</h2>

            <pre className="api-code">
              wait
            </pre>

            <p className="small">
              In progress.
            </p>
          </section>

          <section>
            <h2>Endpoints</h2>

            <div className="api-endpoint">
              <div className="api-method">GET</div>

              <code>/health</code>

              <p>
                Checks whether the API is available.
              </p>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>

              <code>/search?q={"{query}"}</code>

              <p>
                Searches verified songs by title, artist, or album.
                Use <code>limit</code> and <code>offset</code> for
                pagination.
              </p>

              <pre className="api-code">
              GET /api/v1/search?q=metal&amp;limit=25&amp;offset=0
              </pre>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>

              <code>/songs/{'{id}'}</code>

              <p>
                Returns metadata for a verified song.
              </p>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>

              <code>/songs/{'{id}'}/dlrc</code>

              <p>
                Returns the raw DLRC contents as plain text.
              </p>
            </div>

            <div className="api-endpoint">
              <div className="api-method">GET</div>

              <code>/download/{'{id}'}</code>

              <p>
                Downloads the verified DLRC as a .dlrc file.
              </p>
            </div>
          </section>

          <section className="card">
            <h2>Example</h2>

            <pre className="api-code">
              {`GET /api/v1/search?q=underworld

              {
                "data": [
                  {
                    "id": "song-id",
                    "title": "Song Title",
                    "artist": "Artist",
                    "album": "Album",
                    "duration_ms": 222000,
                    "duration": "3:42",
                    "dlrc_version": "1.0",
                    "endpoints": {
                      "song": "/api/v1/songs/song-id",
                      "dlrc": "/api/v1/songs/song-id/dlrc",
                      "download": "/api/v1/download/song-id"
                    }
                  }
                ],
                "meta": {
                  "query": "underworld",
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
            <h2>CORS</h2>

            <p className="small">
              Read-only API endpoints currently allow cross-origin
              GET requests so applications such as AuralArc can
              communicate with the library directly.
            </p>
          </section>

          <Link className="btn" href="/search">
            Browse the library
          </Link>
        </div>
      </div>
    </main>
  );
}
