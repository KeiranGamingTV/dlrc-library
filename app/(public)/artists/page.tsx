import Link from 'next/link';

import {
  listArtists,
} from '@/lib/db';

export const dynamic =
  'force-dynamic';

export default async function ArtistsPage() {
  const artists =
    await listArtists('', 100);

  return (
    <main className="section">
      <div className="container">
        <div className="search-header">
          <div>
            <h1 className="title">
              Artists
            </h1>

            <p className="subtitle">
              Browse verified DLRC files
              by artist.
            </p>
          </div>

          <span className="search-count">
            {artists.length} artist
            {artists.length === 1
              ? ''
              : 's'}
          </span>
        </div>

        {artists.length === 0 ? (
          <div className="card empty">
            <div className="empty-title">
              No artists yet
            </div>

            <p>
              Verified songs will appear
              here once they are published.
            </p>
          </div>
        ) : (
          <div className="browse-grid">
            {artists.map((item) => (
              <Link
                key={item.artist}
                className="browse-card"
                href={`/artists/${encodeURIComponent(item.artist)}`}
              >
                <div className="browse-card-title">
                  {item.artist}
                </div>

                <div className="browse-card-meta">
                  {item.song_count} song
                  {item.song_count === 1
                    ? ''
                    : 's'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}