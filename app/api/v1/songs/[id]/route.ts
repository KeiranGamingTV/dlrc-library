import {
  apiError,
  apiJson,
  apiOptions,
} from '@/lib/api';
import { getSong } from '@/lib/db';
import { formatDuration } from '@/lib/dlrc/parser';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await params;

  const song = await getSong(id);

  if (!song) {
    return apiError('Song not found.', 404);
  }

  return apiJson({
    data: {
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
    },
  });
}
