import crypto from 'node:crypto';

export function createETag(value: string) {
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
  const header =
    request.headers.get('if-none-match');

  if (!header) return false;

  return header
    .split(',')
    .map((value) => value.trim())
    .some(
      (value) =>
        value === etag ||
        value === '*'
    );
}
