import { NextResponse } from 'next/server';

export const API_VERSION = '1';

export function apiHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=30, s-maxage=60',
  };
}

export function apiJson(
  data: unknown,
  init?: ResponseInit
) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...apiHeaders(),
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
