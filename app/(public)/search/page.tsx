import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
import { searchSongs } from '@/lib/db';
import { formatDuration } from '@/lib/dlrc/parser';

export const dynamic = 'force-dynamic';

export default async function SearchPage(
  {searchParams,}: {
    searchParams: Promise<{ q?: string }>;
  }) {
    const { q = '' } = await searchParams;
    const results = await searchSongs(q);

  return (
    <main className="section">
      <div className="container">
        <div className="search-header">
          <div>
            <h1 className="title">
              Search the DLRC Library
            </h1>

            <p className="subtitle">
              Find verified Duet LRC files without an account.
            </p>
          </div>

          {q ? (
            <div className="search-count">
              {results.length} result
              {results.length === 1 ? '' : 's'}
            </div>
          ) : null}
        </div>
        
        <SearchForm initialQuery={q} />

        <div style={{ marginTop: 28 }}>
          {results.length === 0 ? (
            <div className="card empty">
              <div className="empty-title">
                {q
                  ? 'No matching DLRC files'
                  : 'The library is empty'}
              </div>

              <p>
                {q
                  ? 'Try searching by a different title, artist, or album.'
                  : 'No verified DLRC files have been published yet.'}
              </p>

              {q ? (
                <Link className="btn" href="/search">
                  Browse all songs
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="search-results">
              {results.map((song) => (
                <Link
                  className="song-result"
                  key={song.id}
                  href={`/search/${song.id}`}
                >
                  <div className="song-result-main">
                    <div className="song-result-title">
                      {song.title}
                    </div>

                    <div className="song-result-artist">
                      {song.artist}
                    </div>

                    {song.album ? (
                      <div className="song-result-album">
                        {song.album}
                      </div>
                    ) : null}
                  </div>

                  <div className="song-result-meta">
                    {song.duration_ms !== null ? (
                      <span>
                        {formatDuration(song.duration_ms)}
                      </span>
                    ) : null}
                    
                    {song.year ? (
                      <span>{song.year}</span>
                    ) : null}

                    <span>
                      DLRC {song.dlrc_version || '1.0'}
                    </span>
                    <span className="badge">
                      Verified
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}