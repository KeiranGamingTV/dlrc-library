import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <h1>DLRC Library</h1>
          <p>A searchable, verified home for Duet LRC files. Find synchronized duet lyrics or submit your own for review.</p>
          <SearchForm />
          <div className="actions" style={{justifyContent:'center', marginTop:18}}>
            <Link className="btn" href="/search">Browse the library</Link>
            <Link className="btn" href="/auth/signup">Create an account to submit</Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container grid grid-3">
          <div className="card"><h3>Search</h3><p className="meta">No account is required to search or download verified DLRC files.</p></div>
          <div className="card"><h3>Submit</h3><p className="meta">Upload a .dlrc file and the site will parse its metadata before submission.</p></div>
          <div className="card"><h3>Verified</h3><p className="meta">Files become public only after they are reviewed and approved.</p></div>
        </div>
      </section>
    </main>
  );
}
