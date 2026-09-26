import crypto from 'node:crypto';

export function createETag(
  value: string
) {
  const hash = crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');

  return `"${hash}"`;
}

export function isNotModified(
  request: Request,
  etag: string
) {
  return (
    request.headers.get('if-none-match') === etag
  );
}