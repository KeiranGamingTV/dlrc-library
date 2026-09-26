import { NextResponse } from 'next/server';

export const API_VERSION = '1';

export function apiHeaders(cacheSeconds = 30) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, If-None-Match',
    'Cache-Control':
      `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
    'X-API-Version': API_VERSION,
  };
}

export function apiJson(
  data: unknown,
  init?: ResponseInit,
  cacheSeconds = 30
) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...apiHeaders(cacheSeconds),
      ...(init?.headers || {}),
    },
  });
}

export function apiError(
  message: string,
  status = 400
) {
  return apiJson(
    {
      error: {
        message,
        status,
      },
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
    0
  );
}

export function apiOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: apiHeaders(0),
  });
}

export function apiRateLimitResponse(
  limit: number,
  retryAfter: number
) {
  return apiJson(
    {
      error: {
        message:
          'Too many requests. Please try again later.',
        status: 429,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'Cache-Control': 'no-store',
      },
    },
    0
  );
}
