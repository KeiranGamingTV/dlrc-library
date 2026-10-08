import {
  apiError,
  apiJson,
  apiOptions,
  apiRateLimitResponse,
} from '@/lib/api';

import {
  searchSongs,
} from '@/lib/db';

import {
  formatDuration,
} from '@/lib/dlrc/parser';

import {
  checkRateLimit,
} from '@/lib/rate-limit';

export const runtime =
  'nodejs';

const MAX_QUERY_LENGTH = 200;
const MAX_FILTER_LENGTH = 200;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_OFFSET = 100000;

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(
  request: Request
) {
  const rateLimit =
    await checkRateLimit(
      request,
      'search'
    );

  if (!rateLimit.allowed) {
    return apiRateLimitResponse(
      rateLimit.limit,
      rateLimit.retryAfter
    );
  }

  const url =
    new URL(request.url);

  const query =
    (
      url.searchParams.get('q') ||
      ''
    ).trim();

  if (!query) {
    return apiError(
      'A search query is required. Use the q parameter.',
      400
    );
  }

  if (
    query.length >
    MAX_QUERY_LENGTH
  ) {
    return apiError(
      `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
      400
    );
  }

  const artist =
    (
      url.searchParams.get(
        'artist'
      ) || ''
    ).trim();

  const album =
    (
      url.searchParams.get(
        'album'
      ) || ''
    ).trim();

  if (
    artist.length >
    MAX_FILTER_LENGTH
  ) {
    return apiError(
      `artist must be ${MAX_FILTER_LENGTH} characters or fewer.`,
      400
    );
  }

  if (
    album.length >
    MAX_FILTER_LENGTH
  ) {
    return apiError(
      `album must be ${MAX_FILTER_LENGTH} characters or fewer.`,
      400
    );
  }

  const yearText =
    (
      url.searchParams.get(
        'year'
      ) || ''
    ).trim();

  let year:
    | number
    | null = null;

  if (yearText) {
    year = Number(yearText);

    if (
      !Number.isInteger(year) ||
      year < 1 ||
      year > 9999
    ) {
      return apiError(
        'year must be a valid integer between 1 and 9999.',
        400
      );
    }
  }

  const sortValue =
    url.searchParams.get(
      'sort'
    );

  const sort =
    sortValue === 'title' ||
    sortValue === 'artist' ||
    sortValue === 'year'
      ? sortValue
      : 'relevance';

  const limitValue =
    Number(
      url.searchParams.get(
        'limit'
      ) || DEFAULT_LIMIT
    );

  const offsetValue =
    Number(
      url.searchParams.get(
        'offset'
      ) || 0
    );

  if (
    !Number.isInteger(
      limitValue
    ) ||
    limitValue < 1 ||
    limitValue > MAX_LIMIT
  ) {
    return apiError(
      `limit must be an integer between 1 and ${MAX_LIMIT}.`,
      400
    );
  }

  if (
    !Number.isInteger(
      offsetValue
    ) ||
    offsetValue < 0 ||
    offsetValue > MAX_OFFSET
  ) {
    return apiError(
      `offset must be an integer between 0 and ${MAX_OFFSET}.`,
      400
    );
  }

  const result =
    await searchSongs(
      query,
      limitValue,
      offsetValue,
      {
        artist,
        album,
        year,
        sort,
      }
    );

  const songs =
    result.songs;

  return apiJson({
    data: songs.map(
      (song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration_ms:
          song.duration_ms,
        duration:
          formatDuration(
            song.duration_ms
          ),
        year: song.year,
        genre: song.genre,
        composer:
          song.composer,
        lyricist:
          song.lyricist,
        dlrc_version:
          song.dlrc_version ||
          '1.0',
        endpoints: {
          song:
            `/api/v1/songs/${song.id}`,
          dlrc:
            `/api/v1/songs/${song.id}/dlrc`,
          download:
            `/api/v1/download/${song.id}`,
        },
      })
    ),

    meta: {
      query,
      artist:
        artist || null,
      album:
        album || null,
      year,
      sort,
      count:
        songs.length,
      total:
        result.total,
      limit:
        limitValue,
      offset:
        offsetValue,
      has_more:
        offsetValue +
          songs.length <
        result.total,
    },
  });
}