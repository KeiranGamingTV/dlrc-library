'use client';
export function DownloadButton({
  id,  compact = false,
}: {
  id: string;  compact?: boolean;
}) {
  return (
    <a 
      className={`btn btn-primary ${
        compact ? 'btn-compact' : ''
      }`}
      href={`/api/v1/download/${id}`} 
    >
      ↓ Download .dlrc
    </a>
  );
}