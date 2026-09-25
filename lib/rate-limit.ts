import { createAdminClient } from '@/lib/supabase/admin';

export type RateLimitBucket =
  | 'search'
  | 'metadata'
  | 'content';

type RateLimitConfig = {
  limit: number;
};

const LIMITS: Record<
  RateLimitBucket,
  RateLimitConfig
> = {
  search: {
    limit: 60,
  },

  metadata: {
    limit: 120,
  },

  content: {
    limit: 120,
  },
};

function getClientKey(request: Request) {
  const forwarded =
    request.headers.get('x-forwarded-for');

  if (forwarded) {
    return forwarded
      .split(',')[0]
      .trim();
  }

  return (
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function checkRateLimit(
  request: Request,
  bucket: RateLimitBucket
) {
  const config = LIMITS[bucket];

  const now = new Date();

  const windowStart = new Date(
    Math.floor(now.getTime() / 60000) * 60000
  );

  const clientKey = getClientKey(request);

  const admin = createAdminClient();

  const { data, error } = await admin.rpc(
    'check_api_rate_limit',
    {
      p_bucket: bucket,
      p_client_key: clientKey,
      p_window_start: windowStart.toISOString(),
      p_limit: config.limit,
    }
  );

  if (error) {
    console.error(
      'API rate limiter error:',
      error
    );

    /*
     * Fail open if the rate-limit infrastructure
     * itself is unavailable. This prevents the
     * limiter from taking the entire public API
     * offline.
     */
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      retryAfter: 60,
    };
  }

  const result = data?.[0];

  if (!result) {
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      retryAfter: 60,
    };
  }

  return {
    allowed: Boolean(result.allowed),

    limit: config.limit,

    remaining: Math.max(
      0,
      config.limit -
        Number(result.request_count)
    ),

    retryAfter: Number(
      result.retry_after
    ),
  };
}