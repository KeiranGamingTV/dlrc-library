import { apiJson, apiOptions } from '@/lib/api';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const spec = {
    openapi: '3.1.0',

    info: {
      title: 'DLRC Library API',
      version: '1.0.0',
      description:
        'Public, read-only API for searching published songs and retrieving verified DLRC files.',
    },

    servers: [
      {
        url: `${origin}/api/v1`,
        description: 'Current DLRC Library deployment',
      },
    ],

    tags: [
      { name: 'Health' },
      { name: 'Search' },
      { name: 'Songs' },
      { name: 'Downloads' },
    ],

    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Check API availability',
          operationId: 'getHealth',
          responses: {
            '200': {
              description: 'API is responding',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean' },
                      api: { type: 'string' },
                      version: { type: 'string' },
                    },
                    required: ['ok', 'api', 'version'],
                  },
                },
              },
            },
          },
        },
      },

      '/search': {
        get: {
          tags: ['Search'],
          summary: 'Search published songs',
          operationId: 'searchSongs',
          parameters: [
            {
              name: 'q',
              in: 'query',
              required: true,
              description: 'Search query, up to 200 characters.',
              schema: { type: 'string', maxLength: 200 },
            },
            {
              name: 'artist',
              in: 'query',
              required: false,
              schema: { type: 'string', maxLength: 200 },
            },
            {
              name: 'album',
              in: 'query',
              required: false,
              schema: { type: 'string', maxLength: 200 },
            },
            {
              name: 'year',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 9999,
              },
            },
            {
              name: 'sort',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['relevance', 'title', 'artist', 'year'],
                default: 'relevance',
              },
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 25,
              },
            },
            {
              name: 'offset',
              in: 'query',
              required: false,
              schema: {
                type: 'integer',
                minimum: 0,
                maximum: 100000,
                default: 0,
              },
            },
          ],

          responses: {
            '200': {
              description: 'Search results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Song',
                        },
                      },
                      meta: {
                        $ref: '#/components/schemas/SearchMeta',
                      },
                    },
                    required: ['data', 'meta'],
                  },
                },
              },
            },
            '400': {
              $ref: '#/components/responses/BadRequest',
            },
            '429': {
              $ref: '#/components/responses/RateLimited',
            },
          },
        },
      },

      '/songs/{id}': {
        get: {
          tags: ['Songs'],
          summary: 'Get song metadata',
          operationId: 'getSong',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Song metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/Song',
                      },
                    },
                    required: ['data'],
                  },
                },
              },
            },
            '404': {
              $ref: '#/components/responses/NotFound',
            },
            '429': {
              $ref: '#/components/responses/RateLimited',
            },
          },
        },
      },

      '/songs/{id}/dlrc': {
        get: {
          tags: ['Songs'],
          summary: 'Retrieve raw DLRC text',
          operationId: 'getSongDlrc',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
            {
              name: 'If-None-Match',
              in: 'header',
              required: false,
              description:
                'Previously returned ETag, for conditional retrieval.',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Raw DLRC content',
              headers: {
                ETag: {
                  schema: { type: 'string' },
                },
                'Cache-Control': {
                  schema: { type: 'string' },
                },
              },
              content: {
                'text/plain': {
                  schema: { type: 'string' },
                },
              },
            },
            '304': {
              description: 'Cached DLRC content has not changed',
            },
            '404': {
              $ref: '#/components/responses/NotFound',
            },
            '429': {
              $ref: '#/components/responses/RateLimited',
            },
          },
        },
      },

      '/download/{id}': {
        get: {
          tags: ['Downloads'],
          summary: 'Download a DLRC file',
          operationId: 'downloadSongDlrc',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'DLRC file attachment',
              headers: {
                'Content-Disposition': {
                  schema: { type: 'string' },
                },
              },
              content: {
                'application/octet-stream': {
                  schema: { type: 'string', format: 'binary' },
                },
              },
            },
            '404': {
              $ref: '#/components/responses/NotFound',
            },
            '429': {
              $ref: '#/components/responses/RateLimited',
            },
          },
        },
      },
    },

    components: {
      schemas: {
        Song: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            artist: { type: 'string' },
            album: { type: ['string', 'null'] },
            duration_ms: { type: ['integer', 'null'] },
            duration: { type: ['string', 'null'] },
            year: { type: ['integer', 'null'] },
            genre: { type: ['string', 'null'] },
            composer: { type: ['string', 'null'] },
            lyricist: { type: ['string', 'null'] },
            dlrc_version: { type: 'string' },
            endpoints: {
              type: 'object',
              properties: {
                song: { type: 'string' },
                dlrc: { type: 'string' },
                download: { type: 'string' },
              },
              required: ['song', 'dlrc', 'download'],
            },
          },
          required: [
            'id',
            'title',
            'artist',
            'duration_ms',
            'dlrc_version',
            'endpoints',
          ],
        },

        SearchMeta: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            artist: { type: ['string', 'null'] },
            album: { type: ['string', 'null'] },
            year: { type: ['integer', 'null'] },
            sort: { type: 'string' },
            count: { type: 'integer' },
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            has_more: { type: 'boolean' },
          },
          required: [
            'query',
            'count',
            'total',
            'limit',
            'offset',
            'has_more',
          ],
        },

        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                status: { type: 'integer' },
              },
              required: ['message', 'status'],
            },
          },
          required: ['error'],
        },
      },

      responses: {
        BadRequest: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },

        NotFound: {
          description: 'Song not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },

        RateLimited: {
          description: 'Rate limit exceeded',
          headers: {
            'Retry-After': {
              schema: { type: 'integer' },
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  };

  return apiJson(spec, undefined, 3600);
}
