import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';
import { searchSongs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const results = await searchSongs(q);
  return <main className="section"><div className="container">
    <h1 className="title">Search the DLRC Library</h1>
    <p className="subtitle">Only verified files appear here.</p>
    <SearchForm initialQuery={q} />
    <div style={{marginTop:28}} className="list">
      {results.length === 0 ? <div className="empty">{q ? 'No verified DLRC files matched your search.' : 'The library is ready for its first verified file.'}</div> : results.map(song => <Link className="list-item" key={song.id} href={`/search/${song.id}`}>
        <div className="row"><div><strong>{song.title}</strong><div className="meta">{song.artist}{song.album ? ` • ${song.album}` : ''}</div></div><span className="badge">Verified</span></div>
      </Link>)}
    </div>
  </div></main>;
}
