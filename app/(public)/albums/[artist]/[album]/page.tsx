import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getAlbumSongs,
} from '@/lib/db';

import {
  formatDuration,
} from '@/lib/dlrc/parser';

export const dynamic =
  'force-dynamic';

export default async function AlbumPage({
  params,
}: {
  params: Promise<{
    artist: string;
    album: string;
  }>;
}) {
  const {
    artist: encodedArtist,
    album: encodedAlbum,
  } = await params;

  const artist =
    decodeURIComponent(
      encodedArtist
    );

  const album =
    decodeURIComponent(
      encodedAlbum
    );

  const songs =
    await getAlbumSongs(
      artist,
      album
    );

  if (songs.length === 0) {
    notFound();
  }

  return (
    <main className="section">
      <div className="container">
        <div className="album-breadcrumbs">
          <Link
            className="small"
            href="/albums"
          >
            Albums
          </Link>

          <span>/</span>

          <Link
            className="small"
            href={`/artists/${encodeURIComponent(artist)}`}
          >
            {artist}
          </Link>
        </div>

        <div className="artist-page-header">
          <div>
            <div className="verified-label">
              <span className="verified-dot" />
              Verified album
            </div>

            <h1 className="artist-page-title">
              {album}
            </h1>

            <Link
              className="album-artist-link"
              href={`/artists/${encodeURIComponent(artist)}`}
            >
              {artist}
            </Link>

            <p className="subtitle">
              {songs.length} song
              {songs.length === 1
                ? ''
                : 's'}
            </p>
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

                <span>
                  DLRC{' '}
                  {song.dlrc_version ||
                    '1.0'}
                </span>

                <span className="badge">
                  Verified
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}