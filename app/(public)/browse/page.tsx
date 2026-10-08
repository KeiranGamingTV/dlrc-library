import Link from 'next/link';

import {
  listAlbums,
  listArtists,
} from '@/lib/db';

export const dynamic =
  'force-dynamic';

export default async function BrowsePage() {
  const [
    artists,
    albums,
  ] = await Promise.all([
    listArtists('', 12),
    listAlbums('', 12),
  ]);

  return (
    <main className="section">
      <div className="container">
        <div className="search-header">
          <div>
            <h1 className="title">
              Browse the Library
            </h1>

            <p className="subtitle">
              Explore verified Duet LRC
              files by artist or album.
            </p>
          </div>
        </div>

        <section className="browse-section">
          <div className="section-heading">
            <div>
              <h2>
                Artists
              </h2>

              <p>
                Explore songs by artist.
              </p>
            </div>

            <Link
              className="btn"
              href="/artists"
            >
              View all
            </Link>
          </div>

          {artists.length > 0 ? (
            <div className="browse-grid">
              {artists.map(
                (artist) => (
                  <Link
                    key={artist.artist}
                    className="browse-card"
                    href={`/artists/${encodeURIComponent(artist.artist)}`}
                  >
                    <div className="browse-card-title">
                      {artist.artist}
                    </div>

                    <div className="browse-card-meta">
                      {artist.song_count}{' '}
                      song
                      {artist.song_count ===
                      1
                        ? ''
                        : 's'}
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="card empty">
              No artists available yet.
            </div>
          )}
        </section>

        <section className="browse-section">
          <div className="section-heading">
            <div>
              <h2>
                Albums
              </h2>

              <p>
                Explore songs by album.
              </p>
            </div>

            <Link
              className="btn"
              href="/albums"
            >
              View all
            </Link>
          </div>

          {albums.length > 0 ? (
            <div className="browse-grid">
              {albums.map(
                (album) => (
                  <Link
                    key={`${album.artist}|${album.album}`}
                    className="browse-card"
                    href={`/albums/${encodeURIComponent(album.artist)}/${encodeURIComponent(album.album)}`}
                  >
                    <div className="browse-card-title">
                      {album.album}
                    </div>

                    <div className="browse-card-artist">
                      {album.artist}
                    </div>

                    <div className="browse-card-meta">
                      {album.song_count}{' '}
                      song
                      {album.song_count ===
                      1
                        ? ''
                        : 's'}
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="card empty">
              No albums available yet.
            </div>
          )}
        </section>

        <div className="browse-search-cta">
          <h2>
            Looking for something
            specific?
          </h2>

          <p>
            Search the complete verified
            library by song, artist, album,
            year, or a combination of
            filters.
          </p>

          <Link
            className="btn btn-primary"
            href="/search"
          >
            Search the library
          </Link>
        </div>
      </div>
    </main>
  );
}