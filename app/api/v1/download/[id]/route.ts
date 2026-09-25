import { getSong } from '@/lib/db';
import { apiError, apiOptions, apiRateLimitResponse, } from '@/lib/api';
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
      'content'
    );

  if (!rateLimit.allowed) {
    return apiRateLimitResponse(
      rateLimit.limit,
      rateLimit.retryAfter
    );
  }
  
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

  const filename = `${safeFilename(song.title)}.dlrc`;

  return new Response(song.content, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,

      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',

      'Cache-Control':
        'public, max-age=300, s-maxage=3600',
    },
  });
}

function safeFilename(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9._ -]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150) || 'song'
  );
}
