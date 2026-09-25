import {
  apiJson,
  apiOptions,
} from '@/lib/api';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return apiOptions();
}

export async function GET() {
  return apiJson({
    ok: true,
    api: 'dlrc-library',
    version: '1',
  });
}
