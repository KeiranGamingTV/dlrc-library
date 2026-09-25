import {
  apiError,
  apiJson,
  apiOptions,
} from '@/lib/api';
import { searchSongs } from '@/lib/db';
import { formatDuration } from '@/lib/dlrc/parser';

export const runtime = 'nodejs';

const MAX_QUERY_LENGTH = 200;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const MAX_OFFSET = 100000;

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const query = (url.searchParams.get('q') || '').trim();

  if (!query) {
    return apiError(
      'A search query is required. Use the q parameter.',
      400
      );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return apiError(
      `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
      400
    );
  }

  const limitValue = Number(
    url.searchParams.get('limit') || DEFAULT_LIMIT
  );

  const offsetValue = Number(
    url.searchParams.get('offset') || 0
  );

  if (
    !Number.isInteger(limitValue) ||
    limitValue < 1 ||
    limitValue > MAX_LIMIT
  ) {
    return apiError(
      `limit must be an integer between 1 and ${MAX_LIMIT}.`,
      400
    );
  }

  if (
    !Number.isInteger(offsetValue) ||
    offsetValue < 0 ||
    offsetValue > MAX_OFFSET
  ) {
    return apiError(
      `offset must be an integer between 0 and ${MAX_OFFSET}.`,
      400
    );
  }

  const result = await searchSongs(
    query,
    limitValue,
    offsetValue
  );

  const songs = result.songs;

  return apiJson({
    data: songs.map((song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration_ms: song.duration_ms,
      duration: formatDuration(song.duration_ms),
      year: song.year,
      genre: song.genre,
      composer: song.composer,
      lyricist: song.lyricist,
      dlrc_version: song.dlrc_version || '1.0',

      endpoints: {
        song: `/api/v1/songs/${song.id}`,
        dlrc: `/api/v1/songs/${song.id}/dlrc`,
        download: `/api/v1/download/${song.id}`,
      },
    })),

    meta: {
      query,
      count: songs.length,
      total: result.total,
      limit: limitValue,
      offset: offsetValue,

      has_more:
        offsetValue + songs.length < result.total,
    },
  });
}