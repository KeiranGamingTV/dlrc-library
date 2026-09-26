import { getSong } from '@/lib/db';
import { apiError, apiOptions, apiRateLimitResponse } from '@/lib/api';
import { createETag, isNotModified } from '@/lib/http-cache';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function OPTIONS() { return apiOptions(); }

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimit = await checkRateLimit(request, 'content');
  if (!rateLimit.allowed) return apiRateLimitResponse(rateLimit.limit, rateLimit.retryAfter);
  const { id } = await params;
  const song = await getSong(id);
  if (!song) return apiError('Song not found.', 404);

  const etag = createETag(song.content);
  if (isNotModified(request, etag)) return new Response(null, { status: 304, headers: { ETag: etag, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'X-RateLimit-Limit': String(rateLimit.limit), 'X-RateLimit-Remaining': String(rateLimit.remaining) } });

  return new Response(song.content, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `inline; filename="${safeFilename(song.title)}.dlrc"`, ETag: etag, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'X-RateLimit-Limit': String(rateLimit.limit), 'X-RateLimit-Remaining': String(rateLimit.remaining) } });
}

function safeFilename(value: string) { return value.replace(/[^a-zA-Z0-9._ -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 150) || 'song'; }
