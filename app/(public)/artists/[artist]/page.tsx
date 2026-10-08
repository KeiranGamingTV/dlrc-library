import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getArtistSongs,
} from '@/lib/db';

import {
  formatDuration,
} from '@/lib/dlrc/parser';

export const dynamic =
  'force-dynamic';

export default async function ArtistPage({
  params,
}: {
  params: Promise<{
    artist: string;
  }>;
}) {
  const {
    artist: encodedArtist,
  } = await params;

  const artist =
    decodeURIComponent(
      encodedArtist
    );

  const songs =
    await getArtistSongs(artist);

  if (songs.length === 0) {
    notFound();
  }

  const albums = Array.from(
    new Set(
      songs
        .map((song) =>
          song.album?.trim()
        )
        .filter(
          (
            album
          ): album is string =>
            Boolean(album)
        )
    )
  ).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <main className="section">
      <div className="container">
        <Link
          className="small"
          href="/artists"
        >
          ← All artists
        </Link>

        <div className="artist-page-header">
          <div>
            <div className="verified-label">
              <span className="verified-dot" />
              Verified artist
            </div>

            <h1 className="artist-page-title">
              {artist}
            </h1>

            <p className="subtitle">
              {songs.length} song
              {songs.length === 1
                ? ''
                : 's'}
              {albums.length > 0
                ? ` across ${albums.length} album${albums.length === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>
        </div>

        {albums.length > 0 ? (
          <section className="browse-section">
            <div className="section-heading">
              <div>
                <h2>
                  Albums
                </h2>
              </div>
            </div>

            <div className="browse-grid">
              {albums.map(
                (album) => (
                  <Link
                    key={album}
                    className="browse-card"
                    href={`/albums/${encodeURIComponent(artist)}/${encodeURIComponent(album)}`}
                  >
                    <div className="browse-card-title">
                      {album}
                    </div>

                    <div className="browse-card-meta">
                      {
                        songs.filter(
                          (song) =>
                            song.album ===
                            album
                        ).length
                      }{' '}
                      song
                      {
                        songs.filter(
                          (song) =>
                            song.album ===
                            album
                        ).length === 1
                          ? ''
                          : 's'
                      }
                    </div>
                  </Link>
                )
              )}
            </div>
          </section>
        ) : null}

        <section className="browse-section">
          <div className="section-heading">
            <div>
              <h2>
                Songs
              </h2>
            </div>
          </div>

          <div className="search-results">
            {songs.map((song) => (
              <Link
                key={song.id}
                className="song-result"
                href={`/search/${song.id}`}
              >
                <div className="song-result-main">
                  <div className="song-result-title">
                    {song.title}
                  </div>

                  {song.album ? (
                    <div className="song-result-album">
                      {song.album}
                    </div>
                  ) : null}
                </div>

                <div className="song-result-meta">
                  {song.duration_ms !==
                  null ? (
                    <span>
                      {formatDuration(
                        song.duration_ms
                      )}
                    </span>
                  ) : null}

                  {song.year ? (
                    <span>
                      {song.year}
                    </span>
                  ) : null}

                  <span className="badge">
                    Verified
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}