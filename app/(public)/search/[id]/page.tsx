import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSong } from '@/lib/db';
import { DownloadButton } from '@/components/DownloadButton';

export const dynamic = 'force-dynamic';

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await getSong(id);
  if (!song) notFound();
  return <main className="section"><div className="container">
    <div className="row" style={{alignItems:'flex-start'}}>
      <div><Link className="small" href="/search">← Back to search</Link><h1 className="title" style={{marginTop:10}}>{song.title}</h1><p className="subtitle">{song.artist}{song.album ? ` • ${song.album}` : ''}</p></div>
      <DownloadButton id={song.id} />
    </div>
    <div className="grid grid-2" style={{marginTop:20}}>
      <div className="card"><div className="small">Album</div><div>{song.album || '—'}</div></div>
      <div className="card"><div className="small">Duration</div><div>{song.duration_ms ? formatDuration(song.duration_ms) : '—'}</div></div>
      <div className="card"><div className="small">Year</div><div>{song.year || '—'}</div></div>
      <div className="card"><div className="small">DLRC version</div><div>{song.dlrc_version || '1.0'}</div></div>
    </div>
    <section style={{marginTop:24}}><h2>DLRC</h2><pre className="lyrics">{song.content}</pre></section>
  </div></main>;
}
function formatDuration(ms: number) { const s=Math.round(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
