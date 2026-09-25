import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSong } from '@/lib/db';
import { DownloadButton } from '@/components/DownloadButton';
import {
  formatDuration,
  parseDlrc,
} from '@/lib/dlrc/parser';

export const dynamic = 'force-dynamic';

export default async function SongPage({params,}: {
  params: Promise<{ id: string }>;}) {
    const { id } = await params;
    const song = await getSong(id);
    if (!song) {
      notFound();
    }
    const parsed = parseDlrc(song.content);
    return (
      <main className="section">
        <div className="container">
          <Link className="small" href="/search">
            ← Back to search
          </Link>
          
          <div className="song-page-header">
            <div className="song-page-heading">
              <div className="verified-label">
                <span className="verified-dot" />
                Verified DLRC
              </div>
              <h1 className="song-page-title">
                {song.title}
              </h1>
              <div className="song-page-artist">
                {song.artist}
              </div>
              {song.album ? (
                <div className="song-page-album">
                  {song.album}
                </div>
              ) : null}
            </div>
            
            <DownloadButton id={song.id} />
          </div>
          
          <div className="song-stats">
            <div className="song-stat">
              <span>Duration</span>
              <strong>
                {formatDuration(song.duration_ms)}
              </strong>
            </div>
            {song.year ? (
              <div className="song-stat">
                <span>Year</span>
                <strong>{song.year}</strong>
              </div>
            ) : null}

          <div className="song-stat">
            <span>DLRC version</span>
            <strong>
              {song.dlrc_version || '1.0'}
            </strong>
          </div>

          {song.genre ? (
            <div className="song-stat">
              <span>Genre</span>
              <strong>{song.genre}</strong>
            </div>
          ) : null}
        </div>

        <div className="grid grid-2 song-extra-info">
          {song.composer ? (
            <div className="card">
              <div className="small">Composer</div>
              <div>{song.composer}</div>
            </div>
          ) : null}

          {song.lyricist ? (
            <div className="card">
              <div className="small">Lyricist</div>
              <div>{song.lyricist}</div>
            </div>
          ) : null}
        </div>

        <section className="lyrics-section">
          <div className="section-heading">
            <div>
              <h2>Lyrics</h2>
              <p>
                {parsed.lines.length} timestamped line {parsed.lines.length === 1 ? '' : 's'}
              </p>
            </div>

            <DownloadButton id={song.id} />
          </div>

          <div className="public-dlrc">
            {parsed.lines.map((line, index) => (
              <div
                className="public-dlrc-line"
                key={`${line.timestampMs}-${index}`}>
                  <span className="public-dlrc-time">
                    {formatDuration(line.timestampMs)}
                  </span>

                <span
                  className="public-dlrc-speaker"
                  style={
                    line.color
                    ? {
                      borderColor: line.color,
                      color: line.color,
                    }
                    : undefined
                  } >
                    {line.speaker}
                  </span>

                <span
                  className="public-dlrc-text"
                  style={
                    line.color 
                    ? {
                    color: line.color,
                    }
                    : undefined
                  } >
                    {line.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        <details className="raw-dlrc">
          <summary>View raw DLRC</summary>

          <pre className="lyrics">
            {song.content}
          </pre>
        </details>

        <div className="song-footer-actions">
          <DownloadButton id={song.id} />

          <Link className="btn" href="/search">
            ← Back to search
          </Link>
        </div>
      </div>
    </main>
  );
}