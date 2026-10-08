import Link from 'next/link';

import {
  listAlbums,
} from '@/lib/db';

export const dynamic =
  'force-dynamic';

export default async function AlbumsPage() {
  const albums =
    await listAlbums('', 100);

  return (
    <main className="section">
      <div className="container">
        <div className="search-header">
          <div>
            <h1 className="title">
              Albums
            </h1>

            <p className="subtitle">
              Browse verified DLRC files
              by album.
            </p>
          </div>

          <span className="search-count">
            {albums.length} album
            {albums.length === 1
              ? ''
              : 's'}
          </span>
        </div>

        {albums.length === 0 ? (
          <div className="card empty">
            <div className="empty-title">
              No albums yet
            </div>

            <p>
              Verified songs with album
              metadata will appear here.
            </p>
          </div>
        ) : (
          <div className="browse-grid">
            {albums.map((item) => (
              <Link
                key={`${item.artist}|${item.album}`}
                className="browse-card"
                href={`/albums/${encodeURIComponent(item.artist)}/${encodeURIComponent(item.album)}`}
              >
                <div className="browse-card-title">
                  {item.album}
                </div>

                <div className="browse-card-artist">
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