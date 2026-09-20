'use client';
export function DownloadButton({ id }: { id: string }) {
  return <a className="btn btn-primary" href={`/api/v1/download/${id}`}>Download .dlrc</a>;
}
