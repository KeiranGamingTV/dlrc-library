import {
  apiError,
  apiJson,
  apiOptions,
  apiRateLimitResponse,
} from '@/lib/api';
import { getSong } from '@/lib/db';
import { formatDuration } from '@/lib/dlrc/parser';
import {
  createETag,
  isNotModified,
} from '@/lib/http-cache';
import {
  checkRateLimit,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(
  const rateLimit =
    await checkRateLimit(
      request,
      'metadata'
    );

  if (!rateLimit.allowed) {
    return apiRateLimitResponse(
      rateLimit.limit,
      rateLimit.retryAfter
    );
  }

  request: Request,
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

  const etag = createETag(
    JSON.stringify({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration_ms: song.duration_ms,
      year: song.year,
      genre: song.genre,
      composer: song.composer,
      lyricist: song.lyricist,
      dlrc_version: song.dlrc_version,
    })
  );

  if (isNotModified(request, etag)) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',

        X-RateLimit-Limit':
          String(rateLimit.limit),

        'X-RateLimit-Remaining':
          String(rateLimit.remaining),
      },
    });
  }

  return apiJson(
    {
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
    },
    {
      headers: {
        ETag: etag,
      },
    },
    3600
  );
}
