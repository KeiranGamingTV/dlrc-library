import { NextResponse } from 'next/server';

export const API_VERSION = '1';

export function apiHeaders(
  cacheSeconds = 30
) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
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
    { status }
  );
}

export function apiOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: apiHeaders(),
  });
}
