import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSong } from '@/lib/db';
import { formatDuration } from '@/lib/dlrc/parser';

export const dynamic = 'force-dynamic';

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    notFound();
  }

  return (
    <main className="section">
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <Link href="/search" className="btn">
            ← Back to search
          </Link>
        </div>

        <div className="card">
          <div className="search-header">
            <div>
              <div className="badge">
                Verified DLRC
              </div>

              <h1 className="title">
                {song.title}
              </h1>

              <p className="subtitle">
                {song.artist}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginTop: 24,
            }}
          >
            <div>
              <strong>Album</strong>
              <div>{song.album || 'Unknown'}</div>
            </div>

            <div>
              <strong>Duration</strong>
              <div>
                {song.duration_ms !== null
                  ? formatDuration(song.duration_ms)
                  : 'Unknown'}
              </div>
            </div>

            <div>
              <strong>Year</strong>
              <div>{song.year || 'Unknown'}</div>
            </div>

            <div>
              <strong>DLRC Version</strong>
              <div>{song.dlrc_version || '1.0'}</div>
            </div>

            {song.genre ? (
              <div>
                <strong>Genre</strong>
                <div>{song.genre}</div>
              </div>
            ) : null}

            {song.composer ? (
              <div>
                <strong>Composer</strong>
                <div>{song.composer}</div>
              </div>
            ) : null}

            {song.lyricist ? (
              <div>
                <strong>Lyricist</strong>
                <div>{song.lyricist}</div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="card"
          style={{ marginTop: 24 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>
                DLRC Lyrics
              </h2>

              <p className="subtitle">
                Verified Duet LRC source
              </p>
            </div>

            <a
              className="btn"
              href={`/api/v1/download/${song.id}`}
            >
              Download .dlrc
            </a>
          </div>

          <pre
            style={{
              marginTop: 20,
              padding: 20,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              borderRadius: 12,
              background: 'var(--surface-2)',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              lineHeight: 1.6,
            }}
          >
            {song.content}
          </pre>
        </div>
      </div>
    </main>
  );
}