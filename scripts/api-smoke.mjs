import process from 'node:process';

const siteUrl = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://dlrc-library.vercel.app'
).replace(/\/+$/, '');

const apiBase = `${siteUrl}/api/v1`;
const results = [];

function pass(name) {
  results.push({ name, passed: true });
  console.log(`[PASS] ${name}`);
}

function fail(name, error) {
  results.push({ name, passed: false });
  console.error(`[FAIL] ${name}: ${error}`);
}

async function check(name, test) {
  try {
    await test();
    pass(name);
  } catch (error) {
    fail(
      name,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function request(path, options) {
  return fetch(`${apiBase}${path}`, {
    ...options,
    signal: AbortSignal.timeout(15000),
  });
}

async function expectStatus(response, expected) {
  if (response.status !== expected) {
    const body = await response.text();

    throw new Error(
      `Expected HTTP ${expected}, received ${response.status}. ` +
        `Response: ${body.slice(0, 300)}`
    );
  }
}

async function expectApiError(response, expectedStatus) {
  await expectStatus(response, expectedStatus);

  const body = await response.json();

  if (
    body?.error?.status !== expectedStatus ||
    typeof body?.error?.message !== 'string'
  ) {
    throw new Error(
      'The response does not match the documented API error format.'
    );
  }
}

console.log('DLRC LIBRARY API SMOKE TESTS');
console.log('============================');
console.log(`Target: ${apiBase}`);
console.log('');

await check('Health endpoint', async () => {
  const response = await request('/health');

  await expectStatus(response, 200);

  const body = await response.json();

  if (
    body.ok !== true ||
    body.api !== 'dlrc-library' ||
    body.version !== '1'
  ) {
    throw new Error('Unexpected health response.');
  }
});

await check('OpenAPI document', async () => {
  const response = await request('/openapi.json');

  await expectStatus(response, 200);

  const spec = await response.json();

  if (spec.openapi !== '3.1.0') {
    throw new Error('Expected an OpenAPI 3.1.0 document.');
  }

  const requiredPaths = [
    '/health',
    '/search',
    '/songs/{id}',
    '/songs/{id}/dlrc',
    '/download/{id}',
  ];

  for (const path of requiredPaths) {
    if (!spec.paths?.[path]) {
      throw new Error(`Missing OpenAPI path: ${path}`);
    }
  }
});

await check('CORS preflight headers', async () => {
  const response = await request('/search', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://example.com',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'if-none-match',
    },
  });

  await expectStatus(response, 204);

  if (response.headers.get('access-control-allow-origin') !== '*') {
    throw new Error('Missing wildcard Access-Control-Allow-Origin.');
  }

  const allowedHeaders = (
    response.headers.get('access-control-allow-headers') || ''
  )
    .toLowerCase()
    .split(',')
    .map((header) => header.trim());

  if (!allowedHeaders.includes('if-none-match')) {
    throw new Error(
      'Access-Control-Allow-Headers does not include If-None-Match.'
    );
  }
});

await check('Missing search query returns documented 400 error', async () => {
  const response = await request('/search');

  await expectApiError(response, 400);
});

await check('Invalid search limit returns documented 400 error', async () => {
  const response = await request('/search?q=test&limit=101');

  await expectApiError(response, 400);
});

await check('Invalid search year returns documented 400 error', async () => {
  const response = await request('/search?q=test&year=not-a-year');

  await expectApiError(response, 400);
});

const missingId = '00000000-0000-4000-8000-000000000000';

await check('Unknown song metadata returns documented 404 error', async () => {
  const response = await request(`/songs/${missingId}`);

  await expectApiError(response, 404);
});

await check('Unknown song DLRC returns documented 404 error', async () => {
  const response = await request(`/songs/${missingId}/dlrc`);

  await expectApiError(response, 404);
});

await check('Unknown song download returns documented 404 error', async () => {
  const response = await request(`/download/${missingId}`);

  await expectApiError(response, 404);
});

console.log('');
console.log('============================');

const passed = results.filter((result) => result.passed).length;
const total = results.length;

console.log(`${passed}/${total} checks passed`);

if (passed !== total) {
  process.exitCode = 1;
}
