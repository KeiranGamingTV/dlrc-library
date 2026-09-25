import {
  apiError,
  apiJson,
  apiOptions,
} from '@/lib/api';
import { searchSongs } from '@/lib/db';
import { formatDuration } from '@/lib/dlrc/parser';

export const runtime = 'nodejs';

const MAX_QUERY_LENGTH = 200;

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const query = (url.searchParams.get('q') || '').trim();

  if (query.length > MAX_QUERY_LENGTH) {
    return apiError(
      `Search query must be ${MAX_QUERY_LENGTH} characters or fewer.`,
      400
    );
  }

  const songs = await searchSongs(query);

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
    },
  });
}
