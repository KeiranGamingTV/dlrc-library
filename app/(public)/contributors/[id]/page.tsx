import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    return { title: 'Contributor not found · DLRC Library' };
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('display_name,public_profile_enabled')
    .eq('id', id)
    .maybeSingle();

  if (!profile?.public_profile_enabled || !profile.display_name) {
    return { title: 'Contributor not found · DLRC Library' };
  }

  return {
    title: `${profile.display_name} · DLRC Library`,
    description: `View verified DLRC contributions by ${profile.display_name}.`,
  };
}

export default async function ContributorPage({ params }: Props) {
  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    )
  ) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('display_name,public_profile_enabled')
    .eq('id', id)
    .maybeSingle();

  if (profileError) {
    throw new Error('Unable to load contributor profile.');
  }

  if (!profile?.public_profile_enabled || !profile.display_name) {
    notFound();
  }

  const { data: contributions, error: contributionsError } =
    await admin
      .from('submissions')
      .select('id,title,artist,album,reviewed_at')
      .eq('user_id', id)
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(100);

  if (contributionsError) {
    throw new Error('Unable to load contributor contributions.');
  }

  const rows = contributions ?? [];

  return (
    <main className="section">
      <div className="container">
        <Link href="/contributors" className="small">
          ← Contributors
        </Link>

        <header style={{ margin: '24px 0 32px' }}>
          <div className="verified-label">
            <span className="verified-dot" />
            DLRC Library Contributor
          </div>

          <h1 className="title">{profile.display_name}</h1>

          <p className="subtitle">
            {rows.length} verified contribution
            {rows.length === 1 ? '' : 's'}
          </p>
        </header>

        <section>
          <div className="section-heading">
            <div>
              <h2>Verified contributions</h2>
              <p>
                Only approved submissions are shown on this page.
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="card empty">
              <div className="empty-title">
                No verified contributions yet
              </div>
              <p>
                This contributor has not published any DLRC files yet.
              </p>
            </div>
          ) : (
            <div className="search-results">
              {rows.map((song) => (
                <article className="song-result" key={song.id}>
                  <div className="song-result-main">
                    <div className="song-result-title">
                      {song.title}
                    </div>

                    <div className="song-result-artist">
                      {song.artist}
                    </div>

                    {song.album && (
                      <div className="song-result-album">
                        {song.album}
                      </div>
                    )}
                  </div>

                  <div className="song-result-meta">
                    <span className="badge badge-approved">
                      Verified
                    </span>
                    {song.reviewed_at && (
                      <span>
                        {new Date(
                          song.reviewed_at
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={{ marginTop: '32px' }}>
          <Link className="btn" href="/search">
            Explore the library
          </Link>
        </div>
      </div>
    </main>
  );
}
