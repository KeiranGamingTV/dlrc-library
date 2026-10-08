import Link from 'next/link';

import { SearchForm } from '@/components/SearchForm';

import {
  searchSongs,
} from '@/lib/db';

import {
  formatDuration,
} from '@/lib/dlrc/parser';

export const dynamic =
  'force-dynamic';

const PAGE_SIZE = 25;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    artist?: string;
    album?: string;
    year?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params =
    await searchParams;

  const q = params.q ?? '';
  const artist =
    params.artist ?? '';
  const album =
    params.album ?? '';

  const yearValue =
    Number(params.year);

  const year =
    Number.isInteger(yearValue) &&
    yearValue > 0
      ? yearValue
      : null;

  const sort =
    params.sort === 'title' ||
    params.sort === 'artist' ||
    params.sort === 'year'
      ? params.sort
      : 'relevance';

  const requestedPage =
    Number(params.page);

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const offset =
    (page - 1) * PAGE_SIZE;

  const results =
    await searchSongs(
      q,
      PAGE_SIZE,
      offset,
      {
        artist,
        album,
        year,
        sort,
      }
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        results.total /
          PAGE_SIZE
      )
    );

  const hasPrevious =
    page > 1;

  const hasNext =
    page < totalPages;

  function pageHref(
    targetPage: number
  ) {
    const next =
      new URLSearchParams();

    if (q.trim()) {
      next.set(
        'q',
        q.trim()
      );
    }

    if (artist.trim()) {
      next.set(
        'artist',
        artist.trim()
      );
    }

    if (album.trim()) {
      next.set(
        'album',
        album.trim()
      );
    }

    if (year) {
      next.set(
        'year',
        String(year)
      );
    }

    if (sort !== 'relevance') {
      next.set(
        'sort',
        sort
      );
    }

    if (targetPage > 1) {
      next.set(
        'page',
        String(targetPage)
      );
    }

    const query =
      next.toString();

    return query
      ? `/search?${query}`
      : '/search';
  }

  const hasFilters =
    Boolean(
      q ||
      artist ||
      album ||
      year
    );

  return (
    <main className="section">
      <div className="container">
        <div className="search-header">
          <div>
            <h1 className="title">
              Search the DLRC Library
            </h1>

            <p className="subtitle">
              Find verified Duet LRC
              files without an account.
            </p>
          </div>

          {results.total > 0 ? (
            <div className="search-count">
              {results.total} result
              {results.total === 1
                ? ''
                : 's'}
            </div>
          ) : null}
        </div>

        <SearchForm
          initialQuery={q}
          initialArtist={artist}
          initialAlbum={album}
          initialYear={
            year
              ? String(year)
              : ''
          }
          initialSort={sort}
        />

        {hasFilters ? (
          <div className="search-active-filters">
            <span>
              Active filters:
            </span>

            {q ? (
              <span className="filter-chip">
                Search: {q}
              </span>
            ) : null}

            {artist ? (
              <span className="filter-chip">
                Artist: {artist}
              </span>
            ) : null}

            {album ? (
              <span className="filter-chip">
                Album: {album}
              </span>
            ) : null}

            {year ? (
              <span className="filter-chip">
                Year: {year}
              </span>
            ) : null}

            <Link
              className="small"
              href="/search"
            >
              Clear
            </Link>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 28,
          }}
        >
          {results.songs.length ===
          0 ? (
            <div className="card empty">
              <div className="empty-title">
                {hasFilters
                  ? 'No matching DLRC files'
                  : 'The library is empty'}
              </div>

              <p>
                {hasFilters
                  ? 'Try changing your search or filters.'
                  : 'No verified DLRC files have been published yet.'}
              </p>

              {hasFilters ? (
                <Link
                  className="btn"
                  href="/search"
                >
                  Clear search
                </Link>
              ) : null}
            </div>
          ) : (
            <>
              <div className="search-results">
                {results.songs.map(
                  (song) => (
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
                          <Link
                            href={`/artists/${encodeURIComponent(song.artist)}`}
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                          >
                            {song.artist}
                          </Link>
                        </div>

                        {song.album ? (
                          <div className="song-result-album">
                            <Link
                              href={`/albums/${encodeURIComponent(song.artist)}/${encodeURIComponent(song.album)}`}
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >
                              {song.album}
                            </Link>
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
                  )
                )}
              </div>

              {totalPages > 1 ? (
                <div className="pagination">
                  {hasPrevious ? (
                    <Link
                      className="btn"
                      href={pageHref(
                        page - 1
                      )}
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  <span className="pagination-label">
                    Page {page} of{' '}
                    {totalPages}
                  </span>

                  {hasNext ? (
                    <Link
                      className="btn"
                      href={pageHref(
                        page + 1
                      )}
                    >
                      Next →
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}